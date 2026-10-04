import "./_group.css";
import "./current.css";

export function Current() {
    return (
        <main className="kare-current-preview">
            <div className="home-bg" aria-hidden="true" />
            <div className="home-content">
                <div className="home-brand">
                    <div className="home-kicker">Gazete Bulmacası</div>
                    <h1 className="home-title">CROSSWORD</h1>
                    <p className="home-subtitle">Türkçe × İngilizce</p>
                </div>
                <div className="home-actions">
                    <button className="primary-button home-cta" type="button">Oyuna Başla</button>
                    <button className="secondary-button home-cta" type="button">Seviyeler</button>
                </div>
                <div className="home-stats">
                    <div className="home-stat">
                        <span className="home-stat-label">Tamamlanan</span>
                        <strong>0 / 20</strong>
                    </div>
                    <div className="home-stat">
                        <span className="home-stat-label">Son Seviye</span>
                        <strong>—</strong>
                    </div>
                </div>
                <div className="home-progress">
                    <div className="home-progress-track"><div className="home-progress-fill" /></div>
                </div>
            </div>
        </main>
    );
}