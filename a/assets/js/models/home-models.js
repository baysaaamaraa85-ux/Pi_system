import { getInitial } from '../utils/formatters.js';

export class Teacher {
  constructor(data) {
    Object.assign(this, data);
  }

  get avatarInitial() {
    return getInitial(this.name);
  }

  get isSenior() {
    return this.experienceYears >= 3;
  }

  get specialtyText() {
    return this.specialties.join(', ');
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

  get visibleItems() {
    return this.items.filter((item) => item.active !== false);
  }
}

export class HomePageData {
  constructor(raw) {
    this.site = raw.site;
    this.hero = raw.hero;
    this.programSections = raw.programSections.map((section) => new ProgramSection(section));
    this.teachers = raw.teachers.map((teacher) => new Teacher(teacher));
    this.reviews = raw.reviews.map((review) => new Review(review));
    this.processSteps = raw.processSteps;
    this.pricing = raw.pricing;
  }

  get featuredTeachers() {
    return this.teachers.filter((teacher) => teacher.featured);
  }

  get featuredReviews() {
    return this.reviews.filter((review) => review.featured);
  }

  get averageTeacherRating() {
    const total = this.teachers.reduce((sum, teacher) => sum + teacher.rating, 0);
    return (total / this.teachers.length).toFixed(1);
  }

  get totalTeacherExperience() {
    return this.teachers.reduce((sum, teacher) => sum + teacher.experienceYears, 0);
  }
}
