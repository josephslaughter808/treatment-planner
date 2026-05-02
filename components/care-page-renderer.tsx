"use client";

type MediaPanel = {
  title: string;
  description: string;
  type: string;
  duration?: string;
};

type RibbonItem = {
  title: string;
  body: string;
};

type StoryItem = {
  title: string;
  body: string;
};

type NarrativeSection = {
  eyebrow: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  labels?: string[];
  storyItems?: StoryItem[];
  media?: MediaPanel[];
  layout?: "media-right" | "media-left" | "full-bleed";
};

type TimelineStep = {
  label: string;
  title: string;
  body: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

export type CarePageContent = {
  pageKind: string;
  eyebrow: string;
  title: string;
  intro: string[];
  summary?: string;
  heroMedia: MediaPanel;
  heroNote: string;
  ribbon: RibbonItem[];
  sections: NarrativeSection[];
  timeline?: {
    eyebrow: string;
    title: string;
    intro: string;
    notes: string[];
    steps: TimelineStep[];
  };
  gallery?: {
    eyebrow: string;
    title: string;
    intro: string;
    items: MediaPanel[];
  };
  faqs: {
    eyebrow: string;
    title: string;
    intro: string;
    items: FaqItem[];
  };
  closing: {
    title: string;
    body: string;
    note: string;
  };
};

export function CarePageRenderer({ content }: { content: CarePageContent }) {
  return (
    <div className="care-story-page">
      <div className="care-story-page-kind">{content.pageKind}</div>
      <section className="care-story-hero">
        <div className="care-story-copy">
          <div className="eyebrow">{content.eyebrow}</div>
          <h1>{content.title}</h1>
          {content.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {content.summary ? (
            <div className="care-story-summary">
              <p>{content.summary}</p>
            </div>
          ) : null}
        </div>

        <div className="care-story-visual">
          <MediaPlaceholder item={content.heroMedia} large />
          <div className="care-story-note">
            <strong>Why this matters</strong>
            <p>{content.heroNote}</p>
          </div>
        </div>
      </section>

      <section className="care-story-ribbon">
        {content.ribbon.map((item) => (
          <div className="care-story-ribbon-item" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        ))}
      </section>

      {content.sections.map((section) => {
        const layout = section.layout ?? "media-right";
        const mediaMarkup =
          section.media && section.media.length > 0 ? (
            <div className={`care-story-media ${section.media.length > 1 ? "split" : "single"}`}>
              {section.media.map((item) => (
                <MediaPlaceholder item={item} key={`${section.title}-${item.title}`} />
              ))}
            </div>
          ) : null;

        return (
          <section className="care-story-section" key={section.title}>
            {layout === "full-bleed" ? (
              <>
                <div className="care-story-section-head">
                  <div className="eyebrow">{section.eyebrow}</div>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {mediaMarkup}
                <SectionDetails section={section} />
              </>
            ) : (
              <div className="care-story-section-grid">
                {layout === "media-left" ? mediaMarkup : null}
                <div className="care-story-section-copy">
                  <div className="eyebrow">{section.eyebrow}</div>
                  <h2>{section.title}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  <SectionDetails section={section} />
                </div>
                {layout === "media-right" ? mediaMarkup : null}
              </div>
            )}
          </section>
        );
      })}

      {content.timeline ? (
        <section className="care-story-section">
          <div className="eyebrow">{content.timeline.eyebrow}</div>
          <h2>{content.timeline.title}</h2>
          <div className="care-story-route-layout">
            <div className="care-story-route-notes">
              <p>{content.timeline.intro}</p>
              <ul className="care-story-bullets">
                {content.timeline.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
            <div className="care-story-timeline">
              {content.timeline.steps.map((step) => (
                <div className="care-story-timeline-item" key={step.title}>
                  <em>{step.label}</em>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {content.gallery ? (
        <section className="care-story-section">
          <div className="eyebrow">{content.gallery.eyebrow}</div>
          <h2>{content.gallery.title}</h2>
          <p className="care-story-gallery-intro">{content.gallery.intro}</p>
          <div className="care-story-media split">
            {content.gallery.items.map((item) => (
              <MediaPlaceholder item={item} key={`gallery-${item.title}`} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="care-story-faq">
        <div className="eyebrow">{content.faqs.eyebrow}</div>
        <h2>{content.faqs.title}</h2>
        <p className="care-story-gallery-intro">{content.faqs.intro}</p>
        <div className="care-story-faq-list">
          {content.faqs.items.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="care-story-closing">
        <div>
          <div className="eyebrow">Next steps</div>
          <h2>{content.closing.title}</h2>
        </div>
        <div>
          <p>{content.closing.body}</p>
          <p className="care-story-footer-note">{content.closing.note}</p>
        </div>
      </section>
    </div>
  );
}

function SectionDetails({ section }: { section: NarrativeSection }) {
  return (
    <>
      {section.bullets && section.bullets.length > 0 ? (
        <ul className="care-story-bullets">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      {section.storyItems && section.storyItems.length > 0 ? (
        <div className="care-story-list">
          {section.storyItems.map((item) => (
            <div className="care-story-item" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {section.labels && section.labels.length > 0 ? (
        <div className="care-story-label-row">
          {section.labels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      ) : null}
    </>
  );
}

function MediaPlaceholder({
  item,
  large = false
}: {
  item: MediaPanel;
  large?: boolean;
}) {
  return (
    <article className={`care-story-placeholder ${large ? "large" : ""}`}>
      <div className="care-story-placeholder-top">
        <span className="care-story-media-type">{item.type}</span>
        {item.duration ? <span className="care-story-media-duration">{item.duration}</span> : null}
      </div>
      <div>
        <strong>{item.title}</strong>
        <p>{item.description}</p>
      </div>
    </article>
  );
}
