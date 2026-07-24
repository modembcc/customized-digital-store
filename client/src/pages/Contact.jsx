const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/customizeddigitalstore' },
  { name: 'Instagram', href: 'https://instagram.com/customizeddigitalstore' },
  { name: 'X', href: 'https://x.com/customizeddigitalstore' },
  { name: 'YouTube', href: 'https://youtube.com/@customizeddigitalstore' },
  { name: 'Twitch', href: 'https://twitch.tv/customizeddigitalstore' },
];

export default function Contact() {
  return (
    <section>
      <h1>Contact Us</h1>
      <p>Have a question? Reach out to us on social media.</p>
      <ul className="social-links">
        {socialLinks.map((link) => (
          <li key={link.name}>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
