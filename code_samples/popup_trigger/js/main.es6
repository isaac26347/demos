import PopupTrigger from './popup-trigger.es6';
import { SELECTORS } from './constants.es6';

const popups = document.querySelectorAll(SELECTORS.popupTrigger);

popups.forEach((el) => {
    const popupTrigger = new PopupTrigger(el);
    popupTrigger.init();
});
