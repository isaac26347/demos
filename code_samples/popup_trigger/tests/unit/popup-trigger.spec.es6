import ModalEventWrapper from '../../../../blue/common/js/modal-event-wrapper.es6';
import PopupTrigger from '../../js/popup-trigger.es6';
import { INIT_ALL_INPUTS_EVENT } from '../../../ca_sg_forms_light/js/constants.es6';
import Constants from '../../js/constants.es6';
import loggerEvents from '../../../ca_sg_logger_v2/js/constants.es6';

jest.useFakeTimers();

function clearCookies() {
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const index = cookie.indexOf('=');
        const name = index > -1 ? cookie.substr(0, index) : cookie;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
}

describe(`PopupTrigger`, () => {
    let popupTrigger;
    let popup;
    const windowListeners = [];
    let modalMock = {};
    let popupContent;
    let loggerEventHandler;

    beforeEach(() => {
        Fixtour.html('src/rebrand/ca_sg_popup_trigger/tests/unit/fixtures/popup-trigger.html');

        const { addEventListener } = window;
        window.addEventListener = jest.fn().mockImplementation((type, listener) => {
            windowListeners.push({ type, listener });
            addEventListener(type, listener);
        });

        popup = document.querySelector(Constants.SELECTORS.popupTrigger);

        popupContent = document.querySelector(Constants.SELECTORS.popupContent);

        window.caModal = {
            isOpen: false,
            loadModal: jest.fn(() => {
                modalMock.drawFn();
                modalMock.initFn();
            }),
            registerDrawer: jest.fn((type, drawFn, initFn) => {
                modalMock = {
                    type,
                    drawFn,
                    initFn,
                };
            }),
            modal: popupContent.parentNode,
        };

        loggerEventHandler = jest.fn();
        window.addEventListener(loggerEvents.CAPTURE_MESSAGE_EVENT, loggerEventHandler);
    });

    afterEach(() => {
        popupTrigger.destroy();

        // Ensure window listeners are removed after each test
        windowListeners.forEach(({ type, listener }) => window.removeEventListener(type, listener));

        Fixtour.clear();

        popupTrigger = null;
        popup = null;
    });

    describe('When the window.caModal is not available', () => {
        it('should not throw any error', () => {
            window.caModal = null;
            popupTrigger = new PopupTrigger(popup);

            expect(() => popupTrigger.init()).not.toThrow();
        });
    });

    describe('When the popup is not available', () => {
        it('should not throw any error', () => {
            popupContent.remove();
            popupTrigger = new PopupTrigger();

            expect(() => popupTrigger.init()).not.toThrow();
        });
    });

    describe('When the config screen is desktop', () => {
        describe(`and it has the trigger type 'exit'`, () => {
            beforeEach(() => {
                clearCookies();
                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'lg',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            describe('and the user has scrolled to the top of the screen', () => {
                it('should show the popup modal', () => {
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).toHaveBeenCalled();
                });

                it('should send a theme class to the modal if attribute is present', () => {
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    const expectedPayload = {
                        theme: 'test-theme',
                        type: 'popup-trigger',
                    };

                    expect(window.caModal.loadModal).toHaveBeenCalledWith(expectedPayload);
                });

                it('should not send a theme class to the modal if there is no attribute', () => {
                    popup.removeAttribute(PopupTrigger.MODAL_THEME_ATTRIBUTE);

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    const expectedPayload = {
                        theme: '',
                        type: 'popup-trigger',
                    };

                    expect(window.caModal.loadModal).toHaveBeenCalledWith(expectedPayload);
                });
            });

            describe('and the user has not scrolled to the top of the screen', () => {
                it('should not show the popup modal', () => {
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 10,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();
                });
            });

            describe('and there is another modal open', () => {
                it('should not open the popup modal', () => {
                    window.caModal.isOpen = true;
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();
                });
            });

            describe('and the modal has opened', () => {
                it('should track the event on userDB', () => {
                    const handler = jest.fn();
                    window.addEventListener('com.ca.uapi', handler);

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.OPEN_MODAL_EVENT));
                    const expectedPayload = {
                        data: {
                            action: 'open',
                            context: {
                                desktop: {
                                    type: 'exit',
                                },
                            },
                            element: 'exit_intent_popup',
                        },
                        name: 'modal',
                    };

                    expect(handler).toHaveBeenCalled();
                    expect(handler.mock.calls[0][0].detail).toEqual(expectedPayload);
                });

                it('should initialize the forms', () => {
                    const handler = jest.fn();
                    window.addEventListener(INIT_ALL_INPUTS_EVENT, handler);

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.OPEN_MODAL_EVENT));
                    const expectedPayload = `${Constants.SELECTORS.popupContent} .js-form-group`;

                    expect(handler).toHaveBeenCalled();
                    expect(handler.mock.calls[0][0].detail).toEqual(expectedPayload);
                });

                it('should initialize the CAEmailMarketing', () => {
                    window.CAEmailMarketing = {
                        init: jest.fn(),
                    };

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.OPEN_MODAL_EVENT));

                    expect(window.CAEmailMarketing.init).toHaveBeenCalledWith(popupContent);
                });

                it('should refresh the userDB targets', () => {
                    window.CAUApiEvent = {
                        refreshTargets: jest.fn(),
                    };

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.OPEN_MODAL_EVENT));

                    expect(window.CAUApiEvent.refreshTargets).toHaveBeenCalledWith(popupContent);
                });
            });

            describe('and the modal has closed', () => {
                it('should track the event on userDB', () => {
                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.OPEN_MODAL_EVENT));
                    const handler = jest.fn();
                    window.addEventListener('com.ca.uapi', handler);
                    window.dispatchEvent(new CustomEvent(ModalEventWrapper.CLOSE_MODAL_EVENT));
                    const expectedPayload = {
                        data: {
                            action: 'close',
                            context: {
                                desktop: {
                                    type: 'exit',
                                },
                            },
                            element: 'exit_intent_popup',
                        },
                        name: 'modal',
                    };

                    expect(handler).toHaveBeenCalled();
                    expect(handler.mock.calls[0][0].detail).toEqual(expectedPayload);
                });
            });

            describe('and there is the data-popup-disabled attribute', () => {
                it('should not show the popup modal', () => {
                    popup.dataset.popupDisabled = '';

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();

                    delete popup.dataset.popupDisabled;
                });
            });
        });

        describe('and the popup modal has already shown', () => {
            describe('and the user has scrolled to the top of the screen', () => {
                it('should not show the popup modal again', () => {
                    clearCookies();
                    popupTrigger = new PopupTrigger(popup);
                    popupTrigger.init();
                    const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                        detail: {
                            media: 'lg',
                        },
                    });

                    window.dispatchEvent(mediaChangeEvent);

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).toHaveBeenCalled();

                    window.caModal.loadModal.mockClear();

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();
                });
            });
        });

        describe('and the cookie identifier is not set', () => {
            describe('and the user has scrolled to the top of the screen', () => {
                it('should show the popup modal', () => {
                    clearCookies();
                    popup.removeAttribute(PopupTrigger.DATA_POPUP_IDENTIFIER);
                    popupTrigger = new PopupTrigger(popup);
                    popupTrigger.init();
                    const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                        detail: {
                            media: 'lg',
                        },
                    });

                    window.dispatchEvent(mediaChangeEvent);

                    const mouseLeaveEvent = new MouseEvent('mouseleave', {
                        clientY: 0,
                    });

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).toHaveBeenCalled();

                    window.caModal.loadModal.mockClear();

                    window.dispatchEvent(mediaChangeEvent);

                    window.document.documentElement.dispatchEvent(mouseLeaveEvent);

                    expect(window.caModal.loadModal).toHaveBeenCalled();
                });
            });
        });

        describe(`and it has the trigger type 'timed'`, () => {
            beforeEach(() => {
                clearCookies();
                const { screensConfig } = popup.dataset;
                const parsedScreensConfig = JSON.parse(screensConfig);
                parsedScreensConfig.desktop.trigger_after_seconds = '10';
                parsedScreensConfig.desktop.type.push('timed');
                popup.dataset.screensConfig = JSON.stringify(parsedScreensConfig);

                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'lg',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            it('should not show the modal when the user is typing', () => {
                jest.advanceTimersByTime(9000);

                const keyboardEvent = new KeyboardEvent('keydown');
                window.document.dispatchEvent(keyboardEvent);

                jest.advanceTimersByTime(2000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();

                jest.advanceTimersByTime(9000);

                expect(window.caModal.loadModal).toHaveBeenCalled();
            });

            it('should not show the modal if the user typed a metakey', () => {
                jest.advanceTimersByTime(9000);

                const keyboardEvent = new KeyboardEvent('keydown', {
                    metaKey: true,
                });
                window.document.dispatchEvent(keyboardEvent);

                jest.advanceTimersByTime(12000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();
            });

            describe('and there is the data-popup-disabled attribute', () => {
                it('should not show the popup modal', () => {
                    popup.dataset.popupDisabled = '';

                    jest.advanceTimersByTime(12000);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();

                    delete popup.dataset.popupDisabled;
                });
            });
        });

        describe(`and the inactivity methods has 'mouse' set`, () => {
            beforeEach(() => {
                clearCookies();
                const { screensConfig } = popup.dataset;
                const parsedScreensConfig = JSON.parse(screensConfig);
                parsedScreensConfig.desktop.inactivity_methods = ['mouse'];
                parsedScreensConfig.desktop.trigger_after_seconds = '10';
                parsedScreensConfig.desktop.type.push('timed');
                popup.dataset.screensConfig = JSON.stringify(parsedScreensConfig);

                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'lg',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            it('should show the modal only after 10 seconds of mouse inactivity', () => {
                jest.advanceTimersByTime(9000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();

                const mouseMoveEvent = new MouseEvent('mousemove');
                window.dispatchEvent(mouseMoveEvent);

                jest.advanceTimersByTime(2000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();
                window.dispatchEvent(mouseMoveEvent);

                jest.advanceTimersByTime(11000);
                expect(window.caModal.loadModal).toHaveBeenCalled();
            });
        });

        describe(`and the inactivity methods has 'scroll' set`, () => {
            beforeEach(() => {
                clearCookies();
                const { screensConfig } = popup.dataset;
                const parsedScreensConfig = JSON.parse(screensConfig);
                parsedScreensConfig.desktop.inactivity_methods = ['scroll'];
                parsedScreensConfig.desktop.trigger_after_seconds = '10';
                parsedScreensConfig.desktop.type.push('timed');
                popup.dataset.screensConfig = JSON.stringify(parsedScreensConfig);

                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'lg',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            it('should show the modal only after 10 seconds of scroll inactivity', () => {
                jest.advanceTimersByTime(9000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();

                window.dispatchEvent(new CustomEvent('com.ca.styleguide.userScroll'));

                jest.advanceTimersByTime(2000);

                expect(window.caModal.loadModal).not.toHaveBeenCalled();
                window.dispatchEvent(new CustomEvent('com.ca.styleguide.userScroll'));

                jest.advanceTimersByTime(11000);
                expect(window.caModal.loadModal).toHaveBeenCalled();
            });
        });
    });

    describe('When the config screen is mobile', () => {
        describe(`and it has the trigger type 'timed'`, () => {
            beforeEach(() => {
                clearCookies();
                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'xs',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            describe('and less than 3 seconds has passed', () => {
                it('should not show the popup modal', () => {
                    jest.advanceTimersByTime(2000);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();
                });
            });

            describe('and more than 3 seconds has passed', () => {
                it('should show the popup modal', () => {
                    jest.advanceTimersByTime(4000);

                    expect(window.caModal.loadModal).toHaveBeenCalled();
                });
            });
        });
    });

    describe('When the config screen is tablet', () => {
        describe(`and it has the trigger type 'timed'`, () => {
            beforeEach(() => {
                clearCookies();
                popupTrigger = new PopupTrigger(popup);
                popupTrigger.init();

                const mediaChangeEvent = new CustomEvent('com.ca.styleguide.mediaChange', {
                    detail: {
                        media: 'md',
                    },
                });

                window.dispatchEvent(mediaChangeEvent);
            });

            describe('and less than 50 seconds has passed', () => {
                it('should not show the popup modal', () => {
                    jest.advanceTimersByTime(48000);

                    expect(window.caModal.loadModal).not.toHaveBeenCalled();
                });
            });

            describe('and more than 50 seconds has passed', () => {
                it('should show the popup modal', () => {
                    jest.advanceTimersByTime(51000);

                    expect(window.caModal.loadModal).toHaveBeenCalled();
                });
            });
        });
    });

    describe('When the config JSON is invalid', () => {
        it('should log the error using Logger', () => {
            popup.dataset.screensConfig = 'invalid';

            popupTrigger = new PopupTrigger(popup);
            popupTrigger.init();

            expect(loggerEventHandler.mock.calls[0][0].detail).toStrictEqual(expect.objectContaining({
                level: 'warning',
                message: 'Invalid JSON on popup-trigger config',
                context: 'invalid',
            }));
        });
    });
});
