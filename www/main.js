
$.ajaxSetup({ cache: false });

var Clock = (function() {
    var t = null;
    this.freeze = function(time) {
        t = time;
    };
    this.unfreeze = function() {
        t = null;
    };
    this.now = function() {
        return t ? moment(t) : moment();
    };
    return this;
}());

var Calendar = Backbone.Model.extend({
    url: 'events.json',

    defaults: {
        debug: false,
        updatedAt: null,
        rooms: null
    },

    set: function(attrs) {
        if (!this.attributes.rooms) {
            this.attributes.rooms = new Rooms();
        }
        if (typeof attrs.rooms !== 'undefined' && !(attrs.rooms instanceof Rooms)) {
            this.attributes.rooms.set(attrs.rooms);
            delete attrs.rooms;
        }

        if (attrs.debug) {
            Clock.freeze(attrs.updatedAt);
        } else {
            Clock.unfreeze();
        }

        Backbone.Model.prototype.set.apply(this, arguments);
    },

    startPolling: function() {
        var self = this;
        var delay = 1000 * 60;
        this.fetch().fail(function(err) {
            console.debug('Failed to sync events', arguments);
        }).always(function() {
            // TODO: Smarter timeout logic
            setTimeout(self.startPolling.bind(self), delay);
        });
    }
});

var Room = Backbone.Model.extend({
    defaults: {
        name: '',
        events: null
    },

    set: function(attrs) {
        if (!this.attributes.events) {
            this.attributes.events = new RoomEvents();
        }
        if (typeof attrs.events !== 'undefined' && !(attrs.events instanceof RoomEvents)) {
            var events = this.sortEvents(attrs.events);
            this.attributes.events.set(events);
            delete attrs.events;
        }
        Backbone.Model.prototype.set.apply(this, arguments);
    },

    sortEvents: function(events) {
        return _.sortBy(events, function(evt) {
            return moment(evt.startTime).format('x');
        });
    },

    getCurrentEvent: function() {
        return this.get('events').find(function(evt) {
            return evt.isCurrent();
        });
    },

    getNextEvent: function() {
        return this.get('events').find(function(evt) {
            return evt.isNext();
        });
    }
});

var Rooms = Backbone.Collection.extend({
    model: Room
});

var RoomEvent = Backbone.Model.extend({
    defaults: {
        summary: '',
        description: '',
        htmlLink: '',
        startTime: null,
        endTime: null
    },

    isCurrent: function() {
        var now = Clock.now(),
            startTime = moment(this.get('startTime')),
            endTime = moment(this.get('endTime'));
        // "[]" indicates that startTime and endTime are inclusive
        return now.isBetween(startTime, endTime, null, '[]');
    },

    isNext: function() {
        var now = Clock.now(),
            startTime = moment(this.get('startTime'));
        return startTime.isAfter(now);
    },

    isSameDay: function() {
        var now = Clock.now(),
            startTime = moment(this.get('startTime'));
        return startTime.dayOfYear() === now.dayOfYear();
    }
});

var RoomEvents = Backbone.Collection.extend({
    model: RoomEvent
});

function formatDate(dt) {
    return moment(dt).format('MMMM D YYYY, h:mm A');
}

function formatTime(dt) {
    return moment(dt).format('h:mm A');
}

function renderEvent(evt) {
    if (!evt) {
        return '';
    }

    var html = [];
    var className = evt.isCurrent() ? 'current' :
                    evt.isNext() ? 'next' : 'prev';

    html.push('<div class="event ' + className + '"');
    html.push(' data-id="' + evt.id + '">');
    html.push('<span class="summary">');

    if (evt.isNext()) {
        html.push('Next: ');
    }

    html.push(evt.get('summary'));
    html.push('</span>');

    html.push(' <span class="time" title="');
    html.push(formatDate(evt.get('startTime')));
    html.push(' &ndash; ');
    html.push(formatTime(evt.get('endTime')));
    html.push('\n');
    html.push(evt.get('description'));
    html.push('">');

    if (evt.isSameDay()) {
        html.push(formatTime(evt.get('startTime')));
    } else {
        html.push(formatDate(evt.get('startTime')));
    }

    html.push(' &ndash; ');
    html.push(formatTime(evt.get('endTime')));

    html.push('</span>');

    html.push(' <a href="' + evt.get('htmlLink') + '" target="new">Link</a>');
    html.push('</div>');
    return html.join('');
}

var RoomListView = Backbone.View.extend({
    className: 'list',

    render: function() {
        var updatedAt = this.model.get('updatedAt');
        var html = [];
        html.push('<p class="now">' + formatDate(Clock.now()) + '</p>');
        html.push(this.renderRooms());
        if (updatedAt) {
            html.push('<p class="updated-at">Last updated at ' + formatDate(updatedAt) + '</p>');
        }
        this.$el.html(html.join(''));
        return this;
    },

    renderRooms: function() {
        if (!this.model.get('rooms')) {
            return '';
        }
        var self = this;
        var html = [];
        this.model.get('rooms').each(function(room) {
            html.push('<li class="room">');
            html.push('<div class="name">');
            html.push('<a href="#' + room.get('id') + '">' + room.get('name') + '</a>');
            html.push(renderEvent(room.getCurrentEvent() || room.getNextEvent()));
            html.push('</div>');
            html.push('</li>');
        });
        return '<ul>' + html.join('') + '</ul>';
    },

});

var RoomDetailView = Backbone.View.extend({
    events: {
        'click .prev': 'prevEvent',
        'click .next': 'nextEvent'
    },

    attributes: function() {
        return {
            'class': 'room-detail ' + this.model.get('id') + ' style-' + _.random(2)
        };
    },

    prevEvent: function() {
        var events = this.model.get('events');
        for (var i = 0; i < events.size() - 1; i++) {
            var nextId = events.at(i + 1).id;
            var $el = this.$el.find('.event[data-id="' + nextId + '"]');
            if ($el.hasClass('show')) {
                var id = events.at(i).id;
                return this.renderPager(id);
            }
        }
    },

    nextEvent: function() {
        var events = this.model.get('events');
        for (var i = 1; i < events.size(); i++) {
            var prevId = events.at(i - 1).id;
            var $el = this.$el.find('.event[data-id="' + prevId + '"]');
            if ($el.hasClass('show')) {
                var id = events.at(i).id;
                return this.renderPager(id);
            }
        }
    },

    render: function() {
        var html = [];
        html.push('<div class="now">' + formatDate(Clock.now()) + '</div>');

        html.push('<div class="header">');
        html.push('<h1>' + this.model.get('name') + '</h1>');

        html.push('<div class="pager">');
        html.push('<a href="javascript:;" class="prev">[Prev]</a>');
        html.push(' <a href="javascript:;" class="next">[Next]</a>');
        html.push('</div>');

        html.push('<div class="events">');
        html.push(this.model.get('events').map(renderEvent).join(''));
        html.push('</div>');

        html.push('</div>');
        html.push('<div class="back"><a href="#">Back</a></div>');
        this.$el.html(html.join(''));
        this.renderPager();
        return this;
    },

    renderPager: function(eventId) {
        var events = this.model.get('events');
        var btnPrev = this.$el.find('.pager .prev');
        var btnNext = this.$el.find('.pager .next');

        var crit = eventId ? function(evt) { return evt.id === eventId; } :
                             function(evt) { return evt.isCurrent() || evt.isNext(); };

        this.$el.find('.event').removeClass('show');
        this.$el.find('.pager').addClass('hide');

        btnPrev.addClass('disabled');
        btnNext.addClass('disabled');

        var evt = events.find(crit);
        if (evt) {
            var i = events.findIndex(evt);
            this.$el.find('.event[data-id="' + evt.id + '"]').addClass('show');
            btnPrev.toggleClass('disabled', i === 0);
            btnNext.toggleClass('disabled', i === events.size() - 1);

            // Show the pager if there's at least one other event.
            if (events.size() > 1) {
                this.$el.find('.pager').removeClass('hide');
            }
        }
    }
});

var App = Marionette.Application.extend({
    initialize: function(options) {
        this.router = new Marionette.AppRouter({
            controller: this,
            appRoutes: {
                '': 'index',
                ':roomId': 'showRoom'
            }
        });

        this.calendar = options.calendar;
        this.calendar.startPolling();

        this.addRegions({
            mainRegion: options.container
        });

        this.redraw();
    },

    redraw: function() {
        if (this.mainRegion.currentView) {
            this.mainRegion.currentView.render();
        }
        setTimeout(this.redraw.bind(this), 1000 * 45);
    },

    index: function() {
        document.title = 'Room Schedule';

        var view = new RoomListView({
            model: this.calendar
        });
        view.listenTo(this.calendar, 'change', view.render);
        this.mainRegion.show(view);
    },

    showRoom: function(roomId) {
        var model = this.calendar.get('rooms').get(roomId);

        if (!model) {
            return this.index();
        }

        document.title = model.get('name');

        var view = new RoomDetailView({
            model: model
        });
        view.listenTo(this.calendar, 'change', view.render);
        this.mainRegion.show(view);
    }
});

var calendar = new Calendar();
var app = new App({
    container: '#container',
    calendar: calendar
});

app.on('start', function() {
    Backbone.history.start();
});

calendar.fetch().then(function() {
    app.start();
});
