import ButtonIcon from '../buttonIcon';
import SimplePopUpElement from './simplePopUp';
import Icon from '../icon';

export class EnhanceNewMedia extends SimplePopUpElement {
  protected editContainer: HTMLElement
  constructor(private file: File) {
    super('popup-edit-photo popup-enhance-media', {
      closable: true,
      confirmShortcutIsSendShortcut: true,
      body: true,
      scrollable: false
    });
    this.appendFileToPopupBody();
    this.createEditContainer()
  }
  private async appendFileToPopupBody() {
    const popupBody = this.body;
    // console.log(popupBody, 'pop up')
    if(popupBody) {
      const fileElement = document.createElement('div');
      fileElement.classList.add('popup-img-container')
      const img = document.createElement('img');

      // Create a URL representing the file object
      const objectURL = URL.createObjectURL(this.file);
      img.src = objectURL;

      // Set additional properties if needed
      img.alt = 'Uploaded Image';
      img.style.maxWidth = '80%';
      img.style.height = '100%';

      fileElement.appendChild(img);
      popupBody.append(fileElement);

      // Revoke the object URL after the image has loaded to free up memory
      img.onload = () => URL.revokeObjectURL(objectURL);
    } else {
      console.error('Popup body not found');
    }
  }

  // private createEditContainer() {
  //   this.editContainer = document.createElement('div');
  //   this.editContainer.classList.add('image-edit-container');

  //   // Create tab headers
  //   const tabHeaders = document.createElement('div');
  //   tabHeaders.classList.add('tab-headers');

  //   const tabs: Icon = ['send', 'send', 'send', 'send', 'send'];
  //   tabs.forEach((tab, index) => {
  //     const tabHeader = document.createElement('div');
  //     tabHeader.classList.add('tab-header');
  //     if(index === 0) tabHeader.classList.add('active'); // Make the first tab active
  //     tabHeader.innerText = tab;
  //     tabHeader.dataset.index = index.toString();
  //     tabHeader.addEventListener('click', () => this.switchTab(index));
  //     tabHeaders.appendChild(tabHeader);
  //   });

  //   this.editContainer.appendChild(tabHeaders);

  //   // Create tab contents
  //   const tabContents = document.createElement('div');
  //   tabContents.classList.add('tab-contents');

  //   tabs.forEach((tab, index) => {
  //     const tabContent = document.createElement('div');
  //     tabContent.classList.add('tab-content');
  //     if(index === 0) tabContent.classList.add('active'); // Show the first tab content
  //     tabContent.innerText = `${tab} Content`; // Replace this with the actual content for each tab
  //     tabContents.appendChild(tabContent);
  //   });

  //   this.editContainer.appendChild(tabContents);

  //   this.body.append(this.editContainer);
  // }

  private createEditContainer() {
    this.editContainer = document.createElement('div');
    this.editContainer.classList.add('image-edit-container');
    const headerContainer = document.createElement('div');
    headerContainer.classList.add('popup-action-header');

    // Create the close icon
    const btn = this.createBtnIcon();
    btn.classList.add('animated-button-icon');
    const iconElement = Icon('close');
    btn.appendChild(iconElement);
    btn.addEventListener('click', () => this.hide());
    headerContainer.appendChild(btn);
    this.editContainer.appendChild(headerContainer);


    const tabHeaders = document.createElement('div');
    tabHeaders.classList.add('tab-headers');

    const icons: [Icon, string][] = [
      ['send', 'send'],
      ['schedule', 'schedule'],
      ['schedule', 'schedule2'],
      ['schedule', 'schedule3'],
      ['user', 'user']
    ];

    icons.forEach(([iconName, type], index) => {
      const tabHeader = document.createElement('div');
      tabHeader.classList.add('tab-header');
      if(index === 0) tabHeader.classList.add('active');

      const iconElement = Icon(iconName);
      tabHeader.appendChild(iconElement);
      tabHeader.dataset.index = index.toString();
      tabHeader.addEventListener('click', () => this.switchTab(index));
      tabHeaders.appendChild(tabHeader);
    });

    this.editContainer.appendChild(tabHeaders);

    const tabContents = document.createElement('div');
    tabContents.classList.add('tab-contents');

    icons.forEach(([iconName, type], index) => {
      const tabContent = document.createElement('div');
      tabContent.classList.add('tab-content');
      if(index === 0) tabContent.classList.add('active');
      tabContent.innerText = `${type} Content`;
      tabContents.appendChild(tabContent);
    });

    this.editContainer.appendChild(tabContents);

    this.body.append(this.editContainer);
  }


  private switchTab(index: number) {
    const headers = this.editContainer.querySelectorAll('.tab-header');
    const contents = this.editContainer.querySelectorAll('.tab-content');

    headers.forEach((header, idx) => {
      if(idx === index) {
        header.classList.add('active');
      } else {
        header.classList.remove('active');
      }
    });

    contents.forEach((content, idx) => {
      if(idx === index) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });
  }

  private createBtnIcon(...args: Parameters<typeof ButtonIcon>) {
    args[1] ??= {};
    args[1].noRipple = true;
    const button = ButtonIcon(...args);
    button.tabIndex = -1;
    return button;
  }
}
