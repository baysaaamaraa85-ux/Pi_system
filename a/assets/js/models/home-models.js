import { getInitial } from '../utils/formatters.js';

export class Teacher {
  constructor(data) {
    Object.assign(this, data);
  }

  get avatarInitial() {
    return getInitial(this.name);
  }
}

export class Review {
  constructor(data) {
    Object.assign(this, data);
  }

  get avatarInitial() {
    return getInitial(this.author);
  }
}

export class ProgramSection {
  constructor(data) {
    Object.assign(this, data);
  }
}

export class HomePageData {
  constructor(raw) {
    this.site = raw.site;
    this.hero = raw.hero;
    this.programSections = raw.programSections.map((section) => new ProgramSection(section));
    this.teachers = raw.teachers.map((teacher) => new Teacher(teacher));
    this.reviews = raw.reviews.map((review) => new Review(review));
    this.registerSteps = raw.registerSteps;
    this.pricing = raw.pricing;
  }

  get featuredReviews() {
    return this.reviews.filter((review) => review.featured);
  }
}
