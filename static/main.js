function render(data) {
    // Background image
    var image = pickImage(data.images);
    if (image) {
        $('.container').css('background-image', 'url(' + image + ')');
    }

    $('.status').text(getStatus(data));
    $('.subtext').text('Until 3:00 PM');

    console.log(data);
}

function pickImage(images) {
    // TODO: random image
    return images[0];
}

function getStatus(data) {
    return 'Available';

    // get first item >= now
    var now = moment(),
        upcomingEvents = _.filter(data.events.items, function(item) {
            // Filter out past events.
            return now.diff(moment(item.end.dateTime)) <= 0;
        }),
        nextEvent = _.first(upcomingEvents);

    if (!nextEvent) {
        return 'Available';
    }

    // Is the event in progress?
    // now >= start and now <= end
    if (now.diff(moment(nextEvent.start.dateTime)) >= 0
            && now.diff(moment(nextEvent.end.dateTime)) <= 0) {
        return 'Unavailable';
    }

    // Has the event ended?
}

// TODO: reload page after some time
