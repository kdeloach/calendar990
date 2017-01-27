$.ajaxSetup({ cache: false });

var CALENDARS = [
    'azavea.com_37323531353137392d3335@resource.calendar.google.com', // Chicago
    'azavea.com_2d3937313336363332343536@resource.calendar.google.com', // Jakarta
    'azavea.com_2d3832333338333036313739@resource.calendar.google.com', // Istanbul
    'azavea.com_2d33363732373535372d383539@resource.calendar.google.com', // Kiev
    'azavea.com_39393439323539323133@resource.calendar.google.com', // Oslo
    'azavea.com_2d3531323935383832313738@resource.calendar.google.com', // Mumbai
    'azavea.com_2d34343937353334392d353230@resource.calendar.google.com', // Paris
    'azavea.com_32313332323030362d333532@resource.calendar.google.com', // London
    'azavea.com_2d3530363332393734333633@resource.calendar.google.com', // Salta
    'azavea.com_2d35373131323734362d383139@resource.calendar.google.com', // Nairobi
    'azavea.com_2d3433323639353434333335@resource.calendar.google.com', // Madrid
    'azavea.com_2d39343638333133382d393132@resource.calendar.google.com', // Saigon
    'azavea.com_2d313034383935352d393134@resource.calendar.google.com', // Shanghai
    'azavea.com_2d3938333739393434383537@resource.calendar.google.com', // Stockholm
    'azavea.com_3336343733393238383535@resource.calendar.google.com', // New York
    'azavea.com_39383537323133383131@resource.calendar.google.com', // Sydney
    'azavea.com_3732333135313339353335@resource.calendar.google.com', // Tokyo
    'azavea.com_323532323135382d383738@resource.calendar.google.com', // Toronto
    'azavea.com_2d36333733303039323735@resource.calendar.google.com' // Springfield
];

var Clock = (function() {
    this.now = function() {
        // XXX DEBUG
        // return moment('2017-01-27 13:00');
        return moment();
    };
    return this;
}());

function listEvents(calendarId) {
    var timeMin = Clock.now().format();
    var timeMax = Clock.now().add(1, 'days').format();
    var data = {
        calendarId: calendarId,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: timeMin,
        timeMax: timeMax
    };
    return gapi.client.calendar.events.list(data);
}

function listAllEvents() {
    var defer = $.Deferred();
    var batch = gapi.client.newBatch();

    _.each(CALENDARS, function(id) {
        batch.add(listEvents(id));
    });

    batch.then(function(batchResponse) {
        var rooms = _.map(batchResponse.result, function(response) {
            return response.result;
        });
        rooms = _.sortBy(rooms, function(room) {
            return room.summary;
        });
        defer.resolve(rooms);
    });

    return defer.promise();
}

function getRoomName(room) {
    return room.summary.replace('Conf Room - ', '');
}

// Exclude events that have ended.
function upcomingEvents(items) {
    return _.filter(items, function(evt) {
        var now = Clock.now();
        var end = moment(evt.end.dateTime).diff(now, 'minutes');
        return end > 0;
    });
}

// Return room color based on the upcoming event.
function getRoomColor(evt) {
    if (!evt) {
        return 'room-green';
    }

    var now = Clock.now();
    var start = moment(evt.start.dateTime).diff(now, 'minutes');

    if (start > 15) {
        // The event is 15+ minutes away.
        return 'room-green';
    } else if (start > 0 && start <= 15) {
        // The event will start soon.
        return 'room-yellow';
    } else {
        // The event must be in progress.
        return 'room-red';
    }
}

function getRoomEvent(room) {
    var events = upcomingEvents(room.items);
    return events && events[0];
}

function renderRoom(room) {
    var title = getRoomName(room);
    var event = getRoomEvent(room);
    var color = getRoomColor(event);
    var $el = $('<div class="room">');
    $el.addClass(color);
    $el.append('<div class="room-title">' + title + '</div>');
    if (event) {
        var start = moment(event.start.dateTime).local().format('YYYY-MM-DD HH:mm');
        var end = moment(event.end.dateTime).local().format('HH:mm');
        var tooltip = start + ' - ' + end;
        $el.append('<div class="room-event" title="' + tooltip + '">' +
                event.summary + '</div>');
    }
    $('#container').append($el);
}

function start() {
    var i = 0;
    listAllEvents().then(function(rooms) {
        $('#loading').hide();
        _.each(rooms, function(room) {
            setTimeout(function() {
                renderRoom(room);
            }, i++ * 20);
        });
    });
}
