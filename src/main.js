
$.ajaxSetup({ cache: false });

// How much time to wait before fetching fresh data.
// 15 minutes
var UPDATE_INTERVAL = 15 * 60 * 1000;

var CALENDARS = {
    'Conf Room - Chicago': 'azavea.com_37323531353137392d3335@resource.calendar.google.com',
    'Conf Room - Jakarta': 'azavea.com_2d3937313336363332343536@resource.calendar.google.com',
    'Conf Room - Istanbul': 'azavea.com_2d3832333338333036313739@resource.calendar.google.com',
    'Conf Room - Kiev': 'azavea.com_2d33363732373535372d383539@resource.calendar.google.com',
    'Conf Room - Oslo': 'azavea.com_39393439323539323133@resource.calendar.google.com',
    'Conf Room - Mumbai': 'azavea.com_2d3531323935383832313738@resource.calendar.google.com',
    'Conf Room - Paris': 'azavea.com_2d34343937353334392d353230@resource.calendar.google.com',
    'Conf Room - London': 'azavea.com_32313332323030362d333532@resource.calendar.google.com',
    'Conf Room - Salta': 'azavea.com_2d3530363332393734333633@resource.calendar.google.com',
    'Conf Room - Nairobi': 'azavea.com_2d35373131323734362d383139@resource.calendar.google.com',
    'Conf Room - Madrid': 'azavea.com_2d3433323639353434333335@resource.calendar.google.com',
    'Conf Room - Saigon': 'azavea.com_2d39343638333133382d393132@resource.calendar.google.com',
    'Conf Room - Shanghai': 'azavea.com_2d313034383935352d393134@resource.calendar.google.com',
    'Conf Room - Stockholm': 'azavea.com_2d3938333739393434383537@resource.calendar.google.com',
    'Conf Room - New York': 'azavea.com_3336343733393238383535@resource.calendar.google.com',
    'Conf Room - Sydney': 'azavea.com_39383537323133383131@resource.calendar.google.com',
    'Conf Room - Tokyo': 'azavea.com_3732333135313339353335@resource.calendar.google.com',
    'Conf Room - Toronto': 'azavea.com_323532323135382d383738@resource.calendar.google.com',
    'Conf Room - Springfield': 'azavea.com_2d36333733303039323735@resource.calendar.google.com'
};

var GApi = (function() {
    this.listEvents = function(calendarId) {
        var defer = $.Deferred();
        var timeMin = Clock.now().format();
        var timeMax = Clock.now().add(7, 'days').format();
        var data = {
            calendarId: calendarId,
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: timeMin,
            timeMax: timeMax
        };
        return gapi.client.calendar.events.list(data);
    };

    this.reserveRoom = function(calendarId, summary) {
        var data = {
            calendarId: 'primary',
            resource: {
                summary: summary,
                start: { dateTime: Clock.now().format() },
                end: { dateTime: Clock.now().add(30, 'minutes').format() },
                attendees: [{ email: calendarId }]
            },
        };
        return gapi.client.calendar.events.insert(data);
    };

    return this;
}());

var Clock = (function() {
    this.now = function() {
        // DEBUG
        // return moment('2016-05-03 15:30');
        return moment();
    };
    return this;
}());

function Poller(options) {
    var action = options.action,
        immediate = _.isUndefined(options.immediate) ? true : !!options.immediate,
        delay = _.isFunction(options.delay) ? options.delay : function() {
            return options.delay;
        },
        keepGoing = true;

    this.start = function(immediate) {
        keepGoing = true;
        if (immediate) {
            step();
        } else {
            setTimeout(step, delay());
        }
    };

    function step() {
        if (!keepGoing) {
            return;
        }
        action().then(function() {
            setTimeout(step, delay());
        });
    }

    this.stop = function() {
        keepGoing = false;
    };

    return this;
}

function CalendarList() {
    var self = this;
    _.extend(this, Backbone.Events);

    this.fetch = function() {
        var batch = gapi.client.newBatch();

        _.each(CALENDARS, function(id) {
            batch.add(GApi.listEvents(id));
        });

        return batch.then(function(batchResponse) {
            try {
                var responses = _.filter(batchResponse.result, function(response) {
                    return !response.result.error;
                });
                var calendars = _.map(responses, function(response) {
                    var data = response.result;
                    data.id = CALENDARS[data.summary];
                    return data;
                });
                calendars = _.sortBy(calendars, function(calendar) {
                    return calendar.summary;
                });
                self.calendars = calendars;
                self.trigger('change');
            } catch (ex) {
                console.error(ex);
            }
        }, function(error) {
            console.error(error);
        });
    };

    this.findBySlug = function(slug) {
        return _.find(this.calendars, function(calendar) {
            return toSlug(toShortName(calendar.summary)) === slug;
        });
    };

    return this;
}

function Calendar(attributes) {
    var self = this;
    _.extend(this, attributes, Backbone.Events);

    this.fetch = function() {
        return GApi.listEvents(this.id).then(function(response) {
            try {
                _.extend(self, response.result);
                self.trigger('change');
            } catch (ex) {
                console.error(ex);
            }
        }, function(error) {
            console.error(error);
        });
    };

    return this;
}

function toSlug(value) {
    return value.toLocaleLowerCase().replace(' ', '-');
}

function toShortName(name) {
    if (name) {
        return name.replace('Conf Room - ', '');
    }
    return '';
}

function formatDate(dt) {
    return moment(dt).format('MMMM D YYYY, h:mm A');
}

function formatTime(dt) {
    return moment(dt).format('h:mm A');
}

function getCurrentEvent(calendar) {
    return _.find(calendar.items, isCurrent);
}

function getNextEvent(calendar) {
    return _.find(calendar.items, isNext);
}

function isCurrent(evt) {
    var now = Clock.now(),
        startTime = moment(evt.start.dateTime),
        endTime = moment(evt.end.dateTime);
    // "[]" indicates that startTime and endTime are inclusive
    return now.isBetween(startTime, endTime, null, '[]');
}

function isNext(evt) {
    var now = Clock.now(),
        startTime = moment(evt.start.dateTime);
    return startTime.isAfter(now);
}

function isSameDay(evt) {
    var now = Clock.now(),
        startTime = moment(evt.start.dateTime);
    return startTime.dayOfYear() === now.dayOfYear();
}

function renderEvent(evt) {
    if (!evt) {
        return '';
    }

    var html = [];

    var className = [];
    className.push('event');
    className.push(isCurrent(evt) ? 'current' :
                   isNext(evt) ? 'next' : 'prev');
    className.push(isSameDay(evt) ? '' : 'not-today');
    className = className.join(' ').trim();

    html.push('<div class="' + className + '" title="');

    html.push(evt.summary);
    html.push('\n');
    html.push(formatDate(evt.start.dateTime));
    html.push(' &ndash; ');
    html.push(formatTime(evt.end.dateTime));
    html.push('\n');
    html.push(evt.description || '');

    html.push('">');
    html.push('<div class="summary">');

    // if (isNext(evt)) {
    //     html.push('Next: ');
    // }

    html.push(evt.summary);
    html.push('</div>');

    html.push('<div class="time">');
    html.push(moment(evt.start.dateTime).calendar());
    html.push(' &ndash; ');
    html.push(formatTime(evt.end.dateTime));
    html.push(' <a href="' + evt.htmlLink + '" target="new" class="google-link">')
    html.push('<i class="fa fa-google-plus-square" aria-hidden="true"></i></a>');
    html.push('</div>');

    html.push('</div>');
    return html.join('');
}

var RoomListView = Backbone.View.extend({
    className: 'rooms-list',

    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
        var html = this.renderPage();
        this.$el.html(html);
        return this;
    },

    renderPage: function() {
        var html = [];
        if (this.model.calendars.length > 0) {
            html.push('<p class="now">' + formatDate(Clock.now()) + '</p>');
            html.push(this.renderList());
        } else {
            html.push('<div class="error">');
            html.push('<p>');
            html.push('<i class="fa fa-exclamation-circle" aria-hidden="true"></i> ');
            html.push('The Google account you are using is not authorized to view these calendars.');
            html.push('</p>');
            html.push('<p>');
            html.push('<a href="https://accounts.google.com/logout">Sign out</a>');
            html.push('</p>');
            html.push('</div>');
        }
        return html.join('');
    },

    renderList: function() {
        var html = [];
        var calendars = this.model;
        _.each(calendars.calendars, function(calendar) {
            var name = toShortName(calendar.summary);
            var evt = getCurrentEvent(calendar) || getNextEvent(calendar);
            html.push('<li class="room">');
            html.push('<div class="name">');
            html.push('<a href="#' + toSlug(name) + '">' + name + '</a>');
            html.push(renderEvent(evt));
            html.push('</div>');
            html.push('</li>');
        }, this);
        return '<ul>' + html.join('') + '</ul>';
    }
});

var RoomDetailView = Backbone.View.extend({
    events: {
        'click .reserve-room': 'showReserveForm',
    },

    attributes: function() {
        var name = toShortName(this.model.summary);
        return {
            'class': 'room-detail ' + toSlug(name) + ' style-' + _.random(2)
        };
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },

    showReserveForm: function() {
        var html = [];
        // TODO: Wrap in form to capture enter key press
        html.push('<p>');
        html.push('<label for="summary">Summary:</label>');
        html.push('<input type="text" id="summary" />');
        html.push('</p>');

        //html.push('<p>');
        //html.push('<label>Duration: <span id="duration"></span></label>');
        //html.push('</p>');

        //html.push('<p>');
        //html.push('<button class="inc" data-value="-15">-15</button>');
        //html.push('<button class="inc" data-value="15">+15</button>');
        //html.push('<button class="inc" data-value="-60">-60</button>');
        //html.push('<button class="inc" data-value="60">+60</button>');
        //html.push('</p>');

        html.push('<p>');
        html.push('<button id="submit">Create Event</button>');
        html.push('<button id="cancel">Cancel</button>');
        html.push('</p>');

        var $frm = $('<div id="create-event-form">').append(html.join(' '));

        //var MIN_DURATION = 15;
        //var duration = MIN_DURATION;

        //function updateDurationLabel() {
        //    var hours = Math.floor(duration / 60);
        //    var minutes = duration % 60;
        //    var parts = [];
        //    if (hours > 0) {
        //        parts.push(hours + ' hour' + (hours === 1 ? '' : 's'));
        //    }
        //    if (minutes > 0) {
        //        parts.push(minutes + ' minutes');
        //    }
        //    $frm.find('#duration').text(parts.join(' '));
        //}

        //$frm.on('click', '.inc', function() {
        //    var $el = $(this);
        //    var value = parseInt($el.attr('data-value'));
        //    duration = Math.max(duration + value, MIN_DURATION);
        //    updateDurationLabel();
        //});
        $frm.on('click', '#submit', function() {
            var summary = $frm.find('#summary').val();
            //var startTime = moment();
            //var endTime = moment().add(duration, 'minutes');
            GApi.reserveRoom(summary);
            $frm.remove();
        });
        $frm.on('click', '#cancel', function() {
            $frm.remove();
        });

        //updateDurationLabel();
        $('body').append($frm);
        $frm.find('#summary').focus();
    },

    render: function() {
        var html = this.renderPage();
        this.$el.html(html);
        return this;
    },

    renderPage: function() {
        var html = [];
        var name = toShortName(this.model.summary);
        var className = getCurrentEvent(this.model) ? 'unavailable' : 'available';

        html.push('<div class="content ' + className + '">');
        html.push('<h1>' + name + '</h1>');

        // html.push('<div class="pager">');
        // html.push('<a href="javascript:;" class="prev">[Prev]</a>');
        // html.push(' <a href="javascript:;" class="next">[Next]</a>');
        // html.push('</div>');

        html.push('<div class="events">');
        //html.push(_.map(this.model.items, renderEvent).join(''));
        html.push(renderEvent(getCurrentEvent(this.model) || getNextEvent(this.model)));
        html.push('</div>');

        // if (getCurrentEvent(this.model)) {
        //     html.push('<button class="delete-event">End Now</button>');
        // } else {
        //     html.push('<button class="reserve-room">Reserve</button>');
        // }

        html.push('<div class="now">' + formatDate(Clock.now()) + '</div>');
        html.push('</div>');
        html.push('<div class="bg"></div>');
        return html.join('');
    }
});

var Router = Marionette.AppRouter.extend({
    execute: function() {
        this.trigger('preRoute');
        Marionette.AppRouter.prototype.execute.apply(this, arguments);
    }
});

var App = Marionette.Application.extend({
    initialize: function(options) {
        var self = this;

        this.calendarList = options.calendarList;

        this.router = new Router({
            controller: this,
            appRoutes: {
                '': 'index',
                ':roomId': 'showRoom'
            }
        });

        this.router.on('preRoute', function() {
            if (self.cleanup) {
                self.cleanup();
                delete self.cleanup;
            }
        });

        this.addRegions({
            mainRegion: '#container'
        });

        // Redraw once per minute.
        new Poller({
            action: function() {
                self.redraw();
                return $.Deferred().resolve();
            },
            delay: function() {
                // Calculate seconds until next minute (plus some slack).
                return (60 - Clock.now().seconds() + 1) * 1000;
            }
        }).start();

        // Refresh Google API auth token every 45 minutes.
        // Ref: https://developers.google.com/api-client-library/javascript/help/faq#how-do-i-refresh-the-auth-token-and-how-often-should-i-do--------it
        new Poller({
            action: function() {
                refreshAuthToken();
                return $.Deferred().resolve();
            },
            // 45 minutes
            delay: 45 * 60 * 1000,
            immediate: false
        }).start();
    },

    redraw: function() {
        console.log('redraw');
        if (this.mainRegion.currentView) {
            this.mainRegion.currentView.render();
        }
    },

    index: function() {
        var calendarList = this.calendarList;
        document.title = 'All Rooms';

        // Fetch all calendar events at an interval.
        var poll = new Poller({
            action: function() {
                return calendarList.fetch();
            },
            delay: UPDATE_INTERVAL,
            // The calendar data must have been loaded already to get
            // this far, so there is no need to fetch the same data again.
            immediate: false
        });

        poll.start();
        this.cleanup = function() {
            poll.stop();
        };

        var view = new RoomListView({
            model: calendarList
        });
        this.mainRegion.show(view);
    },

    showRoom: function(slug) {
        var calendarData = this.calendarList.findBySlug(slug);
        if (!calendarData) {
            return this.index();
        }

        var calendar = new Calendar(calendarData);
        document.title = toShortName(calendar.summary);

        var poll = new Poller({
            action: function() {
                return calendar.fetch();
            },
            delay: UPDATE_INTERVAL
        });

        poll.start();
        this.cleanup = function() {
            poll.stop();
        };

        var view = new RoomDetailView({
            model: calendar
        });
        this.mainRegion.show(view);
    }
});

function start() {
    var calendarList = new CalendarList();
    calendarList.once('change', function() {
        var app = new App({
            calendarList: calendarList
        });
        Backbone.history.start();
    });
    calendarList.fetch();
}
