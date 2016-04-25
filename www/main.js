
$.ajaxSetup({ cache: false });

var CalendarEvents = Backbone.Model.extend({
    url: 'events.json',

    defaults: {
        now_utc: new Date().getTime(),
        rooms: []
    },

    parse: function(response, options) {
        // Add a few extra attributes to make templates a little simpler.
        _.each(response.rooms, function(room) {
            var now_utc = response.now_utc;
            room.now_utc = now_utc;
            room.events = this.sortEvents(room.events);
            room.current_events = this.getCurrentEvents(now_utc, room);
            room.next_event = this.getNextEvent(now_utc, room);

            // XXX
            _.each(room.current_events, function(evt) {
                evt.is_current = true;
            });

            // XXX
            if (room.next_event) {
                room.next_event.is_next = true;
            }

            // XXX
            // Indicate which event should appear initially in the pager.
            // Assumes events are sorted chronologically.
            for (var i = 0; i < room.events.length; i++) {
                var evt = room.events[i];
                if (evt.is_current || evt.is_next) {
                    room.eventIndex = i;
                    break;
                }
            }
        }, this);
        return response;
    },

    startPolling: function() {
        var self = this;
        this.fetch().fail(function(err) {
            console.debug('Failed to sync events', arguments);
        }).always(function() {
            // TODO: Smarter timeout logic
            // Poll once per minute.
            setTimeout(self.startPolling.bind(self), 1000 * 60);
        });
    },

    getRoom: function(roomId) {
        var roomData = _.findWhere(this.get('rooms'), {id: roomId});
        return new RoomModel(roomData);
    },

    sortEvents: function(events) {
        return _.sortBy(events, function(evt) {
            return moment(evt.start_time).format('x');
        });
    },

    // There can be more than 1 current event if the start/end dates overlap.
    getCurrentEvents: function(now, roomData) {
        now = moment(now);
        return _.filter(roomData.events, function(evt) {
            var start_time = moment(evt.start_time),
                end_time = moment(evt.end_time);
            // "[]" indicates that start_time and end_time are inclusive
            return now.isBetween(start_time, end_time, null, '[]');
        });
    },

    getNextEvent: function(now, roomData) {
        now = moment(now);
        return _.find(roomData.events, function(evt) {
            var start_time = moment(evt.start_time);
            return start_time.isAfter(now);
        });
    }
});

var RoomModel = Backbone.Model.extend({
    defaults: {
        now_utc: new Date().getTime(),
        id: '',
        name: '',
        events: [],
        current_events: [],
        next_events: [],
        // Index of the current event to display on the pager.
        eventIndex: 0
    }
});

var BaseView = Backbone.View.extend({
    initialize: function() {
        Backbone.View.prototype.initialize.apply(this, arguments);
        this.template = _.template($(this.templateId).html());
        this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
        this.$el.html(this.template({
            model: this.model,
            data: this.model.attributes,
            formatDate: this.formatDate,
            formatTime: this.formatTime,
            formatEvent: this.formatEvent
        }));
        return this;
    },

    formatDate: function(dt) {
        return moment(dt).format('MMMM D YYYY, h:mm A');
    },

    formatTime: function(dt) {
        return moment(dt).format('h:mm A');
    },

    formatEvent: function(evt) {
        return new EventView({
            model: new Backbone.Model(evt)
        }).render().$el.html();
    }
});

var IndexView = BaseView.extend({
    templateId: '#tmpl-index',
    className: 'list'
});

var RoomView = BaseView.extend({
    templateId: '#tmpl-room',
    className: 'room',

    events: {
        'click .prev': 'prevEvent',
        'click .next': 'nextEvent'
    },

    prevEvent: function() {
        var eventIndex = this.model.get('eventIndex'),
            currentEvent = this.$el.find('.event:visible');

        if (eventIndex === 0) {
            return;
        }

        this.model.set('eventIndex', Math.max(eventIndex - 1, 0));
    },

    nextEvent: function() {
        var eventIndex = this.model.get('eventIndex'),
            lastEventIndex = this.model.get('events').length - 1,
            currentEvent = this.$el.find('.event:visible');

        if (eventIndex === lastEventIndex) {
            return;
        }

        this.model.set('eventIndex', Math.min(eventIndex + 1, lastEventIndex));
    },

    render: function() {
        BaseView.prototype.render.apply(this, arguments);

        // Add a few extra classes to the container for additional customizations.
        this.$el.addClass(this.model.get('id'));
        this.$el.addClass('style-' + _.random(2));

        this.renderPager();

        return this;
    },

    renderPager: function() {
        var i = this.model.get('eventIndex'),
            $els = this.$el.find('.event');
        if (i >= $els.size()) {
            return;
        }
        $($els[i]).css('display', 'block');
    }
});

var EventView = BaseView.extend({
    templateId: '#tmpl-event'
});

var AppController = Backbone.Router.extend({
    routes: {
        '': 'index',
        ':roomId': 'showRoom'
    },

    initialize: function(calendarEvents) {
        Backbone.Router.prototype.initialize.apply(this, arguments);
        this.calendarEvents = calendarEvents;
    },

    // Wrap Router `execute` function so we can keep track of the current
    // view and clean it up before switching to the next view.
    execute: function(cb, args, name) {
        if (this.currentView) {
            this.currentView.remove();
        }
        this.currentView = cb.apply(this, args);
        this.currentView.render();
        $('body').append(this.currentView.el);
    },

    index: function() {
        return new IndexView({
            model: this.calendarEvents
        });
    },

    showRoom: function(roomId) {
        var self = this,
            model = this.calendarEvents.getRoom(roomId),
            view = new RoomView({
                model: model
            });

        view.listenTo(this.calendarEvents, 'change', function() {
            var newModel = self.calendarEvents.getRoom(roomId);
            model.set(newModel.attributes);
        });

        return view;
    }
});

$(function() {
    var calendarEvents = new CalendarEvents();
    calendarEvents.startPolling();

    new AppController(calendarEvents);
    Backbone.history.start();
});
