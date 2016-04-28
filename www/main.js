
$.ajaxSetup({ cache: false });

var CalendarEvents = Backbone.Model.extend({
    url: 'events.json',

    defaults: {
        updatedAt: new Date().getTime(),
        rooms: []
    },

    parse: function(response, options) {
        var updatedAt = moment(response.updatedAt),
            now = response.debug ? updatedAt : moment();

        var models = _.map(response.rooms, function(room) {
            models.push(new RoomModel({
                // XXX: Copy these values from parent node to each
                // room model to simplify templating.
                now: response.now,
                updatedAt: response.updatedAt,
                events: this.sortEvents(room.events)
            }));
        }, this);

        response.rooms = models;
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

    createRoomModel: function(roomId) {
        var roomData = _.findWhere(this.get('rooms'), {id: roomId});
        return new RoomModel(roomData);
    },

    sortEvents: function(events) {
        return _.sortBy(events, function(evt) {
            return moment(evt.start_time).format('x');
        });
    }
});

var RoomModel = Backbone.Model.extend({
    defaults: {
        now: new Date().getTime(),
        updatedAt: new Date().getTime(),
        id: '',
        name: '',
        events: [],
        eventIndex: 0,
        userEventIndex: 0
    },

    getCurrentEvent: function() {
        return _.find(this.get('events'), this.isCurrent.bind(this));
    },

    getNextEvent: function() {
        return _.find(this.get('events'), this.isNext.bind(this));
    },

    isCurrent: function(evt) {
        var now = this.get('now'),
            startTime = moment(evt.startTime),
            endTime = moment(evt.endTime);
        // "[]" indicates that startTime and endTime are inclusive
        return now.isBetween(startTime, endTime, null, '[]');
    },

    isNext: function(evt) {
        var now = this.get('now'),
            startTime = moment(evt.startTime);
        return startTime.isAfter(now);
    },

    isSameDay: function(evt) {
        var now = this.get('now'),
            startTime = moment(evt.startTime);
        return now.dayOfYear() === startTime.dayOfYear();
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
        if (!evt) {
            return '';
        }
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
    },

    nextEvent: function() {
    },

    render: function() {
        BaseView.prototype.render.apply(this, arguments);

        // Add a few extra classes to the container for additional customizations.
        this.$el.addClass(this.model.get('id'));
        this.$el.addClass('style-' + _.random(2));

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
            model = this.calendarEvents.createRoomModel(roomId),
            view = new RoomView({
                model: model
            });

        view.listenTo(this.calendarEvents, 'change', function() {
            var newModel = self.calendarEvents.createRoomModel(roomId);
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
