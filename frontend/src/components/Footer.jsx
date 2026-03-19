import React from 'react';

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <span className="nav-logo">Cafe <span style={{ color: 'white' }}>1 Cr</span></span>
            <p>Coffee so good, your taste buds will love it. Serving Pune's finest brews since 2019.</p>
          </div>
          <div className="footer-col">
            <h5>Menu</h5>
            <ul>
              <li><a href="#menu">Cappuccino</a></li>
              <li><a href="#menu">Latte</a></li>
              <li><a href="#menu">Machiato</a></li>
              <li><a href="#menu">Cold Brew</a></li>
              <li><a href="#menu">Snacks</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Company</h5>
            <ul>
              <li><a href="#why">About Us</a></li>
              <li><a href="#why">Our Story</a></li>
              <li><a href="#why">Careers</a></li>
              <li><a href="#why">Blog</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h5>Contact</h5>
            <ul>
              <li><a href="#">📍 Karvenagar, Pune</a></li>
              <li><a href="#">📞 +91 98765 43210</a></li>
              <li><a href="#">✉️ hello@cafe1cr.in</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Cafe 1 Cr. All rights reserved.</span>
          <span>Made with ☕ in Pune</span>
        </div>
      </div>
    </footer>
  );
}
