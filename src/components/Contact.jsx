import { useState } from 'react';
import { motion } from 'framer-motion';
import { AtSign, MessageCircle, Phone } from 'lucide-react';

const WHATSAPP_E164 = '918553702039';

function buildWhatsAppMessage({ name, eventType, vision }) {
  const n = name.trim();
  const v = vision.trim();
  return [
    'New inquiry — BY Photography',
    '',
    `Name: ${n}`,
    `Event type: ${eventType}`,
    '',
    'Vision / details:',
    v || '(not provided)',
  ].join('\n');
}

const Contact = () => {
  const [name, setName] = useState('');
  const [eventType, setEventType] = useState('Wedding');
  const [vision, setVision] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const text = buildWhatsAppMessage({ name, eventType, vision });
    const url = `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contact" className="section section-contact">
      <div className="container contact-showcase-wrap">
        <span className="contact-showcase__glow" aria-hidden />
        <span className="contact-showcase__watermark" aria-hidden>
          02
        </span>

        <header className="contact-showcase__header">
          <span className="contact-kicker">OPEN CHANNEL</span>
          <span className="contact-showcase__rule" aria-hidden />
        </header>

        <div className="row g-4 g-lg-5 align-items-stretch">
          <div className="col-lg-6">
            <motion.div
              className="contact-copy-card glass-strong fire-border contact-copy-elevated h-100"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="contact-hero-title">
                <span className="contact-hero-title__line">BEGIN YOUR</span>
                <span className="contact-hero-title__line contact-hero-title__line--fire">JOURNEY</span>
              </h2>
              <p className="contact-lead">
                Ready to turn your vision into a cinematic masterpiece? Drop a line—we&apos;ll meet you in
                the frame.
              </p>

              <ul className="contact-channels">
                <li>
                  <a className="contact-channel glass-subtle fire-border" href="tel:+918553702039">
                    <span className="contact-channel__icon" aria-hidden>
                      <Phone strokeWidth={1.35} size={20} />
                    </span>
                    <span className="contact-channel__body">
                      <span className="contact-channel__label">Call</span>
                      <span className="contact-channel__value">+91 85537 02039</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="contact-channel glass-subtle fire-border"
                    href={`https://wa.me/${WHATSAPP_E164}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="contact-channel__icon" aria-hidden>
                      <MessageCircle strokeWidth={1.35} size={20} />
                    </span>
                    <span className="contact-channel__body">
                      <span className="contact-channel__label">WhatsApp</span>
                      <span className="contact-channel__value">Same number · instant</span>
                    </span>
                  </a>
                </li>
                <li>
                  <a
                    className="contact-channel glass-subtle fire-border"
                    href="https://www.instagram.com/b_y__creation"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="contact-channel__icon" aria-hidden>
                      <AtSign strokeWidth={1.35} size={20} />
                    </span>
                    <span className="contact-channel__body">
                      <span className="contact-channel__label">Instagram</span>
                      <span className="contact-channel__value">@b_y__creation</span>
                    </span>
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          <div className="col-lg-6">
            <motion.form
              className="contact-form-card glass-fire-accent fire-border contact-form-elevated h-100"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
              onSubmit={handleSubmit}
            >
              <div className="contact-form-head">
                <span className="contact-form-badge">WHATSAPP BRIEF</span>
                <p className="contact-form-headline">
                  Send a structured inquiry—opens in WhatsApp with one tap.
                </p>
              </div>

              <div className="contact-field">
                <label className="contact-field-label" htmlFor="contact-name">
                  Name
                </label>
                <input
                  id="contact-name"
                  className="input-glass"
                  type="text"
                  placeholder="Full name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="contact-field">
                <label className="contact-field-label" htmlFor="contact-event">
                  Event type
                </label>
                <select
                  id="contact-event"
                  className="input-glass"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option>Wedding</option>
                  <option>Portrait</option>
                  <option>Commercial</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="contact-field">
                <label className="contact-field-label" htmlFor="contact-vision">
                  Your vision
                </label>
                <textarea
                  id="contact-vision"
                  className="input-glass contact-textarea"
                  placeholder="Mood, dates, references, anything that helps us see what you see…"
                  rows={4}
                  value={vision}
                  onChange={(e) => setVision(e.target.value)}
                />
              </div>

              <button type="submit" className="contact-submit-btn fire-border">
                <span className="contact-submit-btn__main">Open in WhatsApp</span>
                <span className="contact-submit-btn__sub">Pre-filled from this form</span>
              </button>
            </motion.form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
