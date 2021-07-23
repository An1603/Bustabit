define([
    'react',
    'game-logic/engine',
    'stores/GameSettingsStore',
    'actions/GameSettingsActions',
    'game-logic/clib',
    'screenfull'
], function(
    React,
    Engine,
    GameSettingsStore,
    GameSettingsActions,
    Clib,
    Screenfull //Attached to window.screenfull
) {
    var D = React.DOM;

    function getState() {
        return {
            balanceBnbsFormatted: Clib.formatSatoshis(Engine.balanceSatoshis),
            theme: GameSettingsStore.getCurrentTheme()//black || white
        }
    }

    return React.createClass({
        displayName: 'TopBar',

        propTypes: {
            isMobileOrSmall: React.PropTypes.bool.isRequired
        },

        getInitialState: function() {
            var state = getState();
            state.username = Engine.username;
            state.fullScreen = false;
            return state;
        },

        componentDidMount: function() {
            Engine.on({
                game_started: this._onChange,
                game_crash: this._onChange,
                cashed_out: this._onChange
            });
            GameSettingsStore.on('all', this._onChange);
        },

        componentWillUnmount: function() {
            Engine.off({
                game_started: this._onChange,
                game_crash: this._onChange,
                cashed_out: this._onChange
            });
            GameSettingsStore.off('all', this._onChange);
        },

        _onChange: function() {
            this.setState(getState());
        },

        _toggleTheme: function() {
            GameSettingsActions.toggleTheme();
        },

        _toggleFullScreen: function() {
        	window.screenfull.toggle();
            this.setState({ fullScreen: !this.state.fullScreen });
        },

        render: function() {

            var userLogin;
            if(this.state.username) {
                userLogin = D.div({ className: 'user-login' },
                    D.div({ className: 'username'},
                        D.a({className: 'refreshBTN', onClick: function (e) {
                            var _this = $('.refreshBTN');
                            var existingHTML = _this.html();
                            $(_this).html('<span class="fas fa-spinner fa-spin" role="status" aria-hidden="true"></span>').prop('disabled', true);
                            ajaxCall();
                            setTimeout(function() {
                                $(_this).html(existingHTML).prop('disabled', false);
                            }, 3000);
                        }},
                            D.span({ className : 'fa fa-redo'})
                        )
                    ),
                    D.div({ className: 'balance-bnbs' },
                        D.span(null, 'Bnbs: '),
                        D.span({ className: 'balance' }, this.state.balanceBnbsFormatted )
                    ),
                    D.div({ className: 'username' },
                        D.a({ href: '/account'}, this.state.username
                    ))
                );
            } else {
                userLogin = D.div({ className: 'user-login' },
                    D.div({ className: 'register' },
                        D.a({ href: '/register' }, 'Register' )
                    ),
                    D.div({ className: 'login' },
                        D.a({ href: '/login'}, 'Log in' )
                    )
                );
            }

            return D.div({ id: 'top-bar' },
                D.div({ className: 'title' },
                    D.a({ href: '/' },
                        D.img({ src: '/img/' + (this.props.isMobileOrSmall? 'logoOnly.png' : 'logo.png'), height: '36px' })
                    )
                ),
                userLogin,
            )
        }
    });
});