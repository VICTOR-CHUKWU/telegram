import ButtonIcon from '../buttonIcon';
import Icon from '../icon';
import PopupElement from '../popups';
import {EnhanceNewMedia} from './enhanceNewMedia';


export default class EditMedia {
  private file: File;
  protected btnContainer: HTMLElement;

  constructor(file: File, btnContainer: HTMLElement) {
    this.file = file;
    this.btnContainer = btnContainer;

    const icons: [Icon, string][] = [
      ['enhance', 'enhance'],
      ['schedule', 'schedule'],
      ['user', 'user']
    ];
    icons.forEach(([name, type]) => {
      const btn = this.createButtonIcon();
      btn.classList.add('animated-button-icon');
      const iconElement = Icon(name);
      btn.appendChild(iconElement);
      this.btnContainer.appendChild(btn);
    });
    this.addClickEventToFirstButton();
  }

  public createButtonIcon(...args: Parameters<typeof ButtonIcon>) {
    args[1] ??= {};
    args[1].noRipple = true;
    const button = ButtonIcon(...args);
    button.tabIndex = -1;
    return button;
  }

  private addClickEventToFirstButton() {
    const firstButton = this.btnContainer.querySelector('button:first-child');
    if(firstButton) {
      firstButton.addEventListener('click', () => {
        this.triggerPopup();
      });
    }
  }

  private triggerPopup() {
    const enhanceMediaPopup = PopupElement.createPopup(EnhanceNewMedia, this.file);
    enhanceMediaPopup.show();
  }
}
