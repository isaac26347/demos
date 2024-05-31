import Sortable from './sortable.es6';
import Constants from './constants.es6';

const init = () => {
    const selector = Constants.SORTABLE_WRAPPER_SELECTOR;
    const sortables = document.querySelectorAll(selector);

    sortables.forEach((el) => {
        new Sortable(el);
    });
};

init();

window.addEventListener(Constants.INIT_EVENT_NAME, () => init());
