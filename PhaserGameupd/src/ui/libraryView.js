import { archiveVolumes } from '../config/lessonArchive.js';
import { isIslandUnlocked } from '../config/islandVisuals.js';
import './library.css';

const marks = {
  back: 'M20 12H4m7-7-7 7 7 7',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5zM12 14v3',
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function icon(name) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const drawing = document.createElementNS(namespace, 'path');
  drawing.setAttribute('d', marks[name]);
  svg.append(drawing);
  return svg;
}

function button(label, className, action) {
  const control = element('button', className, label);
  control.type = 'button';
  control.addEventListener('click', action);
  return control;
}

export class LibraryView {
  constructor(scene, leave) {
    this.scene = scene;
    this.leave = leave;
    this.root = element('main', 'archive');
    this.root.setAttribute('aria-label', 'Grand Library');
    this.restoreCapture = scene.input.keyboard.manager.preventDefault;
    scene.input.keyboard.disableGlobalCapture();
    this.onKeyDown = event => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      this.back();
    };
    this.onUnlockChange = () => {
      if (this.volume && !isIslandUnlocked(scene, this.volume.island)) this.volume = null;
      if (!this.volume) this.render();
    };
    scene.registry.events.on('changedata-islandUnlocks', this.onUnlockChange);
    document.addEventListener('keydown', this.onKeyDown);
    const canvas = scene.game.canvas;
    this.syncBounds = () => {
      const { left, top, width, height } = canvas.getBoundingClientRect();
      Object.assign(this.root.style, {
        left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px`,
      });
    };
    canvas.parentElement.append(this.root);
    this.syncBounds();
    scene.scale.on('resize', this.syncBounds);
    this.render('heading');
  }

  back() {
    if (!this.volume) {
      if (this.root.inert) return;
      this.root.inert = true;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) this.leave();
      else this.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).onfinish = this.leave;
      return;
    }
    const { island } = this.volume;
    this.volume = null;
    this.render(island.id);
  }

  open(volume) {
    if (!isIslandUnlocked(this.scene, volume.island)) return;
    this.volume = volume;
    this.quarter = volume.quarters[0];
    this.topic = this.quarter?.topics[0];
    this.render('heading', true);
  }

  chooseQuarter(quarter) {
    if (quarter === this.quarter) return;
    this.quarter = quarter;
    this.topic = quarter.topics[0];
    this.render(quarter.id);
  }

  chooseTopic(topic, focus = topic.id) {
    if (topic === this.topic) return;
    this.topic = topic;
    this.render(focus);
  }

  render(focus, opening = false) {
    this.root.dataset.view = this.volume ? 'book' : 'shelf';
    const frame = element('div', 'archive-frame');
    const header = element('header', 'archive-header');
    const back = button(this.volume ? 'Bookshelf' : 'World Map', 'archive-back', () => this.back());
    back.prepend(icon('back'));
    header.append(back);
    frame.append(header, this.volume ? this.reader(opening) : this.bookshelf());
    this.root.replaceChildren(frame);
    this.root.scrollTop = 0;
    if (focus) frame.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: focus === 'heading' });
  }

  bookshelf() {
    const section = element('section', 'archive-hub');
    const heading = element('h1', 'archive-title', 'Grand Library');
    heading.tabIndex = -1;
    heading.dataset.focus = 'heading';
    const introduction = element('div', 'archive-intro');
    introduction.append(heading, element('p', '', 'Open a book to explore its lessons.'));

    const shelf = element('div', 'archive-shelf');
    const openBooks = element('ul', 'archive-volumes archive-open-volumes');
    const sealedBooks = element('ul', 'archive-volumes archive-sealed-volumes');
    openBooks.setAttribute('aria-label', 'Available subject books');
    sealedBooks.setAttribute('aria-label', 'Locked subject books');

    for (const volume of archiveVolumes) {
      const { island, subject, finish } = volume;
      const unlocked = isIslandUnlocked(this.scene, island);
      const item = element('li', 'archive-volume');
      item.dataset.volume = finish;
      const book = button('', 'archive-book', () => this.open(volume));
      book.dataset.finish = finish;
      book.dataset.focus = island.id;
      book.disabled = !unlocked;
      book.setAttribute('aria-label', unlocked ? `Open ${subject} book` : `${subject} book, locked`);
      if (!unlocked) book.append(icon('lock'));
      else if (!['ember', 'moss', 'ocean'].includes(finish)) {
        const art = element('img', 'archive-extra-cover');
        art.alt = '';
        art.src = `/assets/floating-islands/${island.id}.png`;
        book.append(art);
      }
      const lettering = element('span', 'archive-lettering');
      lettering.append(element('span', 'archive-book-title', subject));
      if (unlocked) lettering.append(element('span', 'archive-book-label', island.title.toLowerCase()));
      book.append(lettering);
      item.append(book);
      (unlocked ? openBooks : sealedBooks).append(item);
    }

    for (const list of [openBooks, sealedBooks]) if (list.childElementCount) shelf.append(list);
    section.append(introduction, shelf);
    return section;
  }

  reader(opening) {
    const reader = element('section', `archive-reader${opening ? ' archive-opening' : ''}`);
    reader.dataset.finish = this.volume.finish;
    const header = element('header', 'archive-reader-header');
    const title = element('h1', 'archive-reader-title', this.volume.subject);
    title.dataset.focus = 'heading';
    title.tabIndex = -1;
    const identity = element('div', 'archive-reader-identity');
    identity.append(title, element('p', '', this.volume.island.title.toLowerCase()));
    header.append(identity);
    reader.append(header);

    if (!this.quarter) {
      reader.append(element('p', 'archive-no-notes', 'No lesson notes have been filed for this subject yet.'));
      return reader;
    }

    const quarters = element('div', 'archive-quarters');
    quarters.setAttribute('role', 'group');
    quarters.setAttribute('aria-label', 'Choose a quarter');
    for (const quarter of this.volume.quarters) {
      const tab = button(quarter.label, 'archive-quarter', () => this.chooseQuarter(quarter));
      tab.dataset.focus = quarter.id;
      tab.setAttribute('aria-pressed', String(quarter === this.quarter));
      quarters.append(tab);
    }
    header.append(quarters);
    if (!this.topic) {
      reader.append(element('p', 'archive-no-notes', 'No topics have been filed for this quarter yet.'));
      return reader;
    }
    const spread = element('div', 'archive-spread');
    spread.append(this.contents(), this.notes());
    reader.append(spread);
    return reader;
  }

  contents() {
    const index = element('nav', 'archive-contents');
    index.setAttribute('aria-label', 'Quarter contents');
    const list = element('ul', 'archive-topics');
    const select = element('select', 'archive-topic-menu');
    select.dataset.focus = 'topic-menu';

    for (const topic of this.quarter.topics) {
      const choice = button(topic.title, 'archive-topic', () => this.chooseTopic(topic));
      choice.dataset.focus = topic.id;
      if (topic === this.topic) choice.setAttribute('aria-current', 'true');
      const item = element('li');
      item.append(choice);
      list.append(item);
      const option = element('option', '', topic.title);
      option.value = topic.id;
      select.append(option);
    }

    select.value = this.topic.id;
    select.addEventListener('change', () => {
      const topic = this.quarter.topics.find(topic => topic.id === select.value);
      this.chooseTopic(topic, 'topic-menu');
    });
    const field = element('label', 'archive-topic-field', 'Topic');
    field.append(select);
    index.append(element('h2', 'archive-contents-title', 'Contents'), list, field);
    return index;
  }

  notes() {
    const article = element('article', 'archive-notes');
    article.append(element('h2', 'archive-topic-title', this.topic.title), element('p', 'archive-overview', this.topic.note));
    if (!this.topic.lessons.length) {
      article.append(element('p', 'archive-no-notes', 'This topic has an overview. Lesson entries are still being prepared.'));
      return article;
    }

    const lessons = element('section', 'archive-lessons');
    lessons.append(element('h3', '', 'Lesson notes'));
    for (const lesson of this.topic.lessons) {
      const entry = element('details', 'archive-entry');
      entry.append(element('summary', '', lesson.title), element('p', '', lesson.note));
      lessons.append(entry);
    }
    article.append(lessons);
    return article;
  }

  destroy() {
    this.scene.scale.off('resize', this.syncBounds);
    this.scene.registry.events.off('changedata-islandUnlocks', this.onUnlockChange);
    document.removeEventListener('keydown', this.onKeyDown);
    if (this.restoreCapture) this.scene.input.keyboard.enableGlobalCapture();
    this.root.remove();
  }
}
