import { FaEnvelope, FaFacebook, FaInstagram, FaTwitch, FaXTwitter, FaYoutube } from 'react-icons/fa6';

const businessEmail = 'hello@customizeddigitalstore.com';

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/customizeddigitalstore', Icon: FaFacebook },
  { name: 'Instagram', href: 'https://instagram.com/customizeddigitalstore', Icon: FaInstagram },
  { name: 'X', href: 'https://x.com/customizeddigitalstore', Icon: FaXTwitter },
  { name: 'YouTube', href: 'https://youtube.com/@customizeddigitalstore', Icon: FaYoutube },
  { name: 'Twitch', href: 'https://twitch.tv/customizeddigitalstore', Icon: FaTwitch },
];

export default function Contact() {
  return (
    <section className="profile-card">
      <div className="profile-image" aria-hidden="true">
        <span>CDS</span>
      </div>
      <div className="profile-info">
        <h1>Customized Digital Store</h1>
        <p className="profile-handle">@customizeddigitalstore</p>
        <p className="profile-bio">
          Independent creator making custom digital goods. Questions about an order, or just want
          to say hi? Reach out by email or find me on social — that&apos;s where I&apos;m most
          active.
        </p>
        <a className="profile-email" href={`mailto:${businessEmail}`}>
          <FaEnvelope aria-hidden="true" />
          {businessEmail}
        </a>
        <ul className="social-links">
          {socialLinks.map(({ name, href, Icon }) => (
            <li key={name}>
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name}>
                <Icon aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
