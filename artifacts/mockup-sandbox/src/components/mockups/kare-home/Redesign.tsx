import "./_group.css";
import "./redesign.css";

export function Redesign() {
    return (
        <main className="kare-new-preview">
            <div className="home-bg" aria-hidden="true" />
            <button className="sound-toggle" type="button">
                <span aria-hidden="true">♫</span>
                <span>Müziği başlat</span>
            </button>
            <div className="home-content">
                <div className="home-brand">
                    <div className="home-mark" aria-hidden="true">
                        <span /><span /><span /><span /><span /><span /><span /><span /><span />
                    </div>
                    <div className="home-kicker"><span className="home-kicker-line" /> Kelime bulmacası</div>
                    <h1 className="home-title font-extrabold">KARE</h1>
                    <p className="home-subtitle">Türkçe tanımlarla kelimeleri keşfet.</p>
                </div>
                <div className="home-actions">
                    <button className="primary-button home-cta" type="button">
                        <span>Oyuna Başla</span><span className="home-cta-arrow" aria-hidden="true">↗</span>
                    </button>
                    <button className="secondary-button home-cta" type="button">Seviyeleri Gör</button>
                </div>
                <div className="home-stats">
                    <div className="home-stat">
                        <span className="home-stat-label">Tamamlanan seviyeler</span>
                        <strong>0 / 20</strong>
                    </div>
                    <div className="home-stat">
                        <span className="home-stat-label">Son Seviye</span>
                        <strong>—</strong>
                    </div>
                </div>
                <div className="home-progress">
                    <div className="home-progress-meta"><span>Genel ilerleme</span><span>0%</span></div>
                    <div className="home-progress-track"><div className="home-progress-fill" /></div>
                </div>
            </div>
        </main>
    );
}