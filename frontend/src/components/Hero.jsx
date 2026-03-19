import React from 'react';

export default function Hero() {
  return (
    <section id="hero" style={{ paddingTop: '160px', paddingBottom: '80px', paddingLeft: 0, paddingRight: 0, maxWidth: '100%' }}>
      <div className="hero-bg"></div>
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">
            Coffee so good,<br />your taste buds<br />will <em>love it.</em>
          </h1>
          <p className="hero-sub">
            The best grain, the finest roast, the most powerful flavor. Experience coffee the way it was always meant to be.
          </p>
          <div className="hero-ctas">
            <button className="btn-hero-primary" onClick={() => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' })}>
              Order Now
            </button>
            <button className="btn-hero-outline" onClick={() => document.getElementById('special').scrollIntoView({ behavior: 'smooth' })}>
              Explore Menu
            </button>
          </div>
          <div className="hero-stats">
            <div>
              <div className="stat-val">4.9★</div>
              <div className="stat-label">Average Rating</div>
            </div>
            <div>
              <div className="stat-val">50k+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div>
              <div className="stat-val">30+</div>
              <div className="stat-label">Coffee Blends</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="coffee-scene-wrap">
            <svg className="coffee-scene" viewBox="0 0 420 480" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="pourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B3A1F" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#3D1E0A" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id="coffeeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5C2E0A" />
                  <stop offset="100%" stopColor="#3D1A06" />
                </linearGradient>
                <linearGradient id="cupGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FFFDF9" />
                  <stop offset="100%" stopColor="#F5E8D8" />
                </linearGradient>
                <linearGradient id="saucerGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="100%" stopColor="#EDD9BE" />
                </linearGradient>
                <radialGradient id="glowGrad" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#C8732A" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#C8732A" stopOpacity="0" />
                </radialGradient>
                <clipPath id="cupClip">
                  <path d="M148,228 L156,318 Q158,328 168,330 L252,330 Q262,328 264,318 L272,228 Z" />
                </clipPath>
              </defs>

              <ellipse cx="210" cy="310" rx="130" ry="80" fill="url(#glowGrad)" className="anim-glow" />

              <g className="pourer-group">
                <g className="pourer-anim">
                  <ellipse cx="210" cy="62" rx="38" ry="18" fill="#2D1208" opacity="0.95" />
                  <rect x="172" y="62" width="76" height="36" rx="6" fill="#2D1208" opacity="0.95" />
                  <ellipse cx="210" cy="98" rx="38" ry="12" fill="#1A0A04" opacity="0.9" />
                  <path d="M210,98 Q210,108 214,114 L220,118" stroke="#1A0A04" strokeWidth="7" fill="none" strokeLinecap="round" />
                  <path d="M248,70 Q268,70 268,82 Q268,94 248,94" stroke="#3D1A08" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <ellipse cx="196" cy="66" rx="10" ry="4" fill="rgba(255,255,255,0.15)" transform="rotate(-20 196 66)" />
                </g>
              </g>

              <g className="pour-stream-group">
                <path className="pour-stream" d="M218,118 Q219,160 217,195 Q216,215 215,228" stroke="url(#pourGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path className="pour-stream-shimmer" d="M220,130 Q221,165 219,198 Q218,215 217,228" stroke="rgba(255,200,120,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <circle className="droplet d1" cx="218" cy="145" r="3" fill="#7A4010" opacity="0.7" />
                <circle className="droplet d2" cx="216" cy="175" r="2" fill="#7A4010" opacity="0.6" />
                <circle className="droplet d3" cx="217" cy="205" r="2.5" fill="#7A4010" opacity="0.8" />
              </g>

              <g className="cup-group">
                <ellipse cx="210" cy="342" rx="80" ry="14" fill="url(#saucerGrad)" stroke="#D9C4A8" strokeWidth="1" />
                <ellipse cx="210" cy="338" rx="68" ry="10" fill="white" stroke="#E8D5BE" strokeWidth="0.5" />
                <path d="M148,228 L156,318 Q158,330 168,332 L252,332 Q262,330 264,318 L272,228 Z" fill="url(#cupGrad)" stroke="#D9C4A8" strokeWidth="1.5" />
                <ellipse cx="210" cy="228" rx="62" ry="14" fill="white" stroke="#D9C4A8" strokeWidth="1.5" />
                <g clipPath="url(#cupClip)">
                  <rect className="coffee-fill" x="146" y="320" width="128" height="12" fill="url(#coffeeGrad)" rx="2" />
                  <ellipse className="foam-ellipse" cx="210" cy="268" rx="52" ry="10" fill="#C8843A" opacity="0.5" />
                  <ellipse className="foam-ellipse" cx="210" cy="268" rx="38" ry="7" fill="#D4945A" opacity="0.4" />
                  <g className="latte-art" opacity="0">
                    <path d="M210,258 C204,248 192,250 192,260 C192,268 210,278 210,278 C210,278 228,268 228,260 C228,250 216,248 210,258Z" fill="rgba(255,220,160,0.55)" />
                  </g>
                </g>
                <ellipse cx="210" cy="230" rx="58" ry="11" fill="rgba(60,20,5,0.18)" />
                <path d="M272,256 Q300,256 300,278 Q300,300 272,300" stroke="#D0B898" strokeWidth="10" fill="none" strokeLinecap="round" />
                <path d="M272,256 Q296,256 296,278 Q296,300 272,300" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.6" />
                <path d="M158,240 Q162,290 163,315" stroke="rgba(255,255,255,0.5)" strokeWidth="4" fill="none" strokeLinecap="round" />
                <path d="M165,238 Q168,275 169,305" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <g className="splash-group" opacity="0">
                  <circle cx="195" cy="222" r="4" fill="#7A4010" opacity="0.7" />
                  <circle cx="225" cy="220" r="3" fill="#7A4010" opacity="0.6" />
                  <circle cx="210" cy="218" r="2.5" fill="#9A5820" opacity="0.8" />
                  <circle cx="185" cy="225" r="2" fill="#7A4010" opacity="0.5" />
                  <circle cx="236" cy="224" r="2" fill="#7A4010" opacity="0.5" />
                </g>
              </g>

              <g className="steam-group">
                <path className="steam s1" d="M190,224 C186,210 194,200 190,186 C186,172 194,162 190,148" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path className="steam s2" d="M210,220 C206,204 214,192 210,176 C206,160 214,148 210,132" stroke="rgba(255,255,255,0.65)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path className="steam s3" d="M230,224 C226,210 234,200 230,186 C226,172 234,162 230,148" stroke="rgba(255,255,255,0.55)" strokeWidth="3" fill="none" strokeLinecap="round" />
                <path className="steam s4" d="M175,228 C172,216 178,208 175,196 C172,184 178,174 175,162" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path className="steam s5" d="M245,228 C242,216 248,208 245,196 C242,184 248,174 245,162" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
              </g>

              <g opacity="0.6">
                <ellipse className="bean b1" cx="108" cy="290" rx="10" ry="6" fill="#4A2008" transform="rotate(-30 108 290)" />
                <ellipse className="bean b2" cx="320" cy="270" rx="8" ry="5" fill="#4A2008" transform="rotate(20 320 270)" />
                <ellipse className="bean b3" cx="95" cy="340" rx="7" ry="4" fill="#5C2E0A" transform="rotate(15 95 340)" />
                <ellipse className="bean b4" cx="330" cy="330" rx="9" ry="5.5" fill="#3D1A06" transform="rotate(-25 330 330)" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
