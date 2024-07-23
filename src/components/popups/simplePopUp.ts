import ripple from '../ripple';
import appNavigationController, {NavigationItem} from '../appNavigationController';
import findUpClassName from '../../helpers/dom/findUpClassName';
import blurActiveElement from '../../helpers/dom/blurActiveElement';
import ListenerSetter from '../../helpers/listenerSetter';
import {attachClickEvent, simulateClickEvent} from '../../helpers/dom/clickEvent';
import isSendShortcutPressed from '../../helpers/dom/isSendShortcutPressed';
import cancelEvent from '../../helpers/dom/cancelEvent';
import EventListenerBase, {EventListenerListeners} from '../../helpers/eventListenerBase';
import {addFullScreenListener, getFullScreenElement} from '../../helpers/dom/fullScreen';
import indexOfAndSplice from '../../helpers/array/indexOfAndSplice';
import {AppManagers} from '../../lib/appManagers/managers';
import overlayCounter from '../../helpers/overlayCounter';
import Scrollable from '../scrollable';
import {getMiddleware, MiddlewareHelper} from '../../helpers/middleware';
import toggleDisability from '../../helpers/dom/toggleDisability';
import {JSX} from 'solid-js';
import {render} from 'solid-js/web';

export type PopupButton = {
  text?: HTMLElement | DocumentFragment | Text,
  callback?: (e: MouseEvent) => void | MaybePromise<boolean>,
  isDanger?: boolean,
  isCancel?: boolean,
  element?: HTMLButtonElement,
  noRipple?: boolean
};

export type PopupOptions = Partial<{
  closable: boolean,
  overlayClosable: boolean,
  body: boolean,
  footer: boolean,
  confirmShortcutIsSendShortcut: boolean,
  withoutOverlay: boolean,
  scrollable: boolean,
  buttons: Array<PopupButton>,
}>;

export interface PopupElementConstructable<T extends SimplePopUpElement = any> {
  new(...args: any[]): T;
}

const DEFAULT_APPEND_TO = document.body;
let appendPopupTo = DEFAULT_APPEND_TO;

const onFullScreenChange = () => {
  appendPopupTo = getFullScreenElement() || DEFAULT_APPEND_TO;
  SimplePopUpElement.reAppend();
};

addFullScreenListener(DEFAULT_APPEND_TO, onFullScreenChange);

type PopupListeners = {
  close: () => void,
  closeAfterTimeout: () => void
};

export default class SimplePopUpElement<T extends EventListenerListeners = {}> extends EventListenerBase<PopupListeners & T> {
  private static POPUPS: SimplePopUpElement<any>[] = [];
  public static MANAGERS: AppManagers;

  protected element = document.createElement('div');
  protected container = document.createElement('div');
  protected footer: HTMLElement;
  protected btnConfirm: HTMLButtonElement;
  protected body: HTMLElement;
  protected buttonsEl: HTMLElement;

  protected navigationItem: NavigationItem;
  protected listenerSetter: ListenerSetter;
  protected confirmShortcutIsSendShortcut: boolean;
  protected btnConfirmOnEnter: HTMLElement;
  protected withoutOverlay: boolean;
  protected managers: AppManagers;
  protected scrollable: Scrollable;
  protected buttons: Array<PopupButton>;
  protected middlewareHelper: MiddlewareHelper;
  protected destroyed: boolean;
  protected night: boolean;

  constructor(className: string, options: PopupOptions = {}) {
    super(false);
    this.element.classList.add('popup');
    this.element.className = 'popup' + (className ? ' ' + className : '');
    this.container.classList.add('popup-container', 'z-depth-1');

    if(overlayCounter.isDarkOverlayActive) {
      this.night = true;
      this.element.classList.add('night');
    }

    this.listenerSetter = new ListenerSetter();
    this.managers = SimplePopUpElement.MANAGERS;
    this.middlewareHelper = getMiddleware();
    this.confirmShortcutIsSendShortcut = options.confirmShortcutIsSendShortcut;
    this.withoutOverlay = options.withoutOverlay;

    // if(options.closable) {
    //   const btnClose = document.createElement('button');
    //   btnClose.classList.add('popup-close');
    //   attachClickEvent(btnClose, () => this.hide(), {listenerSetter: this.listenerSetter});
    //   this.container.appendChild(btnClose);
    // }

    if(options.body) {
      this.body = document.createElement('div');
      this.body.classList.add('popup-body');
      this.container.appendChild(this.body);
    }

    if(options.scrollable) {
      const scrollable = this.scrollable = new Scrollable(this.body);
      this.attachScrollableListeners();
    }

    if(options.footer) {
      this.footer = document.createElement('div');
      this.footer.classList.add('popup-footer');
      (this.body || this.container).append(this.footer);
    }

    this.btnConfirmOnEnter = this.btnConfirm;
    this.setButtons(options.buttons);

    this.element.appendChild(this.container);

    SimplePopUpElement.POPUPS.push(this);
  }

  protected setButtons(buttons: PopupButton[]) {
    this.buttons = buttons;
    if(this.buttonsEl) {
      this.buttonsEl.remove();
      this.buttonsEl = undefined;
    }

    if(!buttons?.length) {
      return;
    }

    const buttonsDiv = this.buttonsEl = document.createElement('div');
    buttonsDiv.classList.add('popup-buttons');

    const buttonsElements = buttons.map((b) => {
      const button = document.createElement('button');
      button.className = 'popup-button btn' + (b.isDanger ? ' danger' : ' primary');

      if(!b.noRipple) {
        ripple(button);
      }

      if(b.text) {
        button.append(b.text);
      }

      attachClickEvent(button, async(e) => {
        let result = b.callback?.(e);
        if(result !== undefined && result instanceof Promise) {
          const toggle = toggleDisability([b.element], true);
          try {
            result = await result;
          } catch(err) {
            result = false;
          }

          if(result === false) {
            toggle();
          }
        }

        if(result === false) {
          return;
        }

        this.hide();
      }, {listenerSetter: this.listenerSetter});

      return b.element = button;
    });

    if(!this.btnConfirmOnEnter && buttons.length === 2) {
      const button = buttons.find((button) => !button.isCancel);
      if(button) {
        this.btnConfirmOnEnter = button.element;
      }
    }

    if(buttons.length >= 3) {
      buttonsDiv.classList.add('is-vertical-layout');
    }

    buttonsDiv.append(...buttonsElements);
    this.container.append(buttonsDiv);
  }

  protected attachScrollableListeners() {
    return this.scrollable.attachBorderListeners();
  }

  public show() {
    this.navigationItem = {
      type: 'popup',
      onPop: () => this.destroy()
    };

    appNavigationController.pushItem(this.navigationItem);

    blurActiveElement();
    appendPopupTo.append(this.element);
    void this.element.offsetWidth;
    this.element.classList.add('active');

    if(!this.withoutOverlay) {
      overlayCounter.isOverlayActive = true;
    }

    setTimeout(() => {
      if(!this.element.classList.contains('active')) {
        return;
      }

      this.listenerSetter.add(document.body)('keydown', (e) => {
        if(!this.btnConfirmOnEnter ||
          (this.btnConfirmOnEnter as HTMLButtonElement).disabled ||
          SimplePopUpElement.POPUPS[SimplePopUpElement.POPUPS.length - 1] !== this) {
          return;
        }

        if(this.confirmShortcutIsSendShortcut ? isSendShortcutPressed(e) : e.key === 'Enter') {
          simulateClickEvent(this.btnConfirmOnEnter);
          cancelEvent(e);
        }
      });
    }, 0);
  }

  public hide() {
    if(this.destroyed || !this.navigationItem) {
      return;
    }

    appNavigationController.backByItem(this.navigationItem);
  }

  public hideWithCallback(callback: () => void) {
    this.addEventListener('closeAfterTimeout', callback as any);
    this.hide();
  }

  protected destroy() {
    if(this.destroyed) {
      return;
    }

    this.destroyed = true;
    this.dispatchEvent<PopupListeners>('close');
    this.element.classList.add('hiding');
    this.element.classList.remove('active');
    this.listenerSetter.removeAll();
    this.middlewareHelper.destroy();

    if(!this.withoutOverlay) {
      overlayCounter.isOverlayActive = false;
    }

    appNavigationController.removeItem(this.navigationItem);
    this.navigationItem = undefined;

    indexOfAndSplice(SimplePopUpElement.POPUPS, this);

    onFullScreenChange();

    setTimeout(() => {
      this.element.remove();
      this.dispatchEvent<PopupListeners>('closeAfterTimeout');
      this.cleanup();
      this.scrollable?.destroy();
    }, 250);
  }

  protected appendSolid(callback: () => JSX.Element) {
    const div = document.createElement('div');
    (this.scrollable || this.body).append(div);
    const dispose = render(callback, div);
    this.addEventListener('closeAfterTimeout', dispose as any);
  }

  public static reAppend() {
    this.POPUPS.forEach((popup) => {
      const {element, container} = popup;
      const parentElement = element.parentElement;
      if(parentElement && parentElement !== appendPopupTo && appendPopupTo !== container) {
        appendPopupTo.append(element);
      }
    });
  }

  public static getPopups<T extends SimplePopUpElement>(popupConstructor: PopupElementConstructable<T>) {
    return this.POPUPS.filter((element) => element instanceof popupConstructor) as T[];
  }

  public static createPopup<T extends /* PopupElement */ any, A extends Array<any>>(ctor: { new(...args: A): T }, ...args: A) {
    const popup = new ctor(...args);
    return popup;
  }
}

export const addCancelButton = (buttons: PopupButton[]) => {
  const button = buttons.find((b) => b.isCancel);
  if(!button) {
    buttons.push({
      text: document.createTextNode('Cancel'),
      isCancel: true
    });
  }

  return buttons;
};
