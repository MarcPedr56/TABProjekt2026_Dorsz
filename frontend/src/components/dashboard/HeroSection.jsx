import React from 'react';

const HeroSection = () => (
    <>
        <div className="hero" style={{ height: "400px", backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945')", backgroundSize: "cover", backgroundPosition: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div className="overlay" style={{ background: "rgba(0,0,0,0.5)", color: "white", padding: "40px", textAlign: "center" }}>
                <h1 className="heroTitle" style={{ fontSize: "32px", marginBottom: "10px", fontFamily: "Georgia" }}>Hotel Bursztyn</h1>
                <p className="heroSubtitle" style={{ fontSize: "16px" }}>
                    Wyjątkowe miejsce nad morzem, gdzie komfort spotyka elegancję
                </p>
            </div>
        </div>

        <div className="section" style={{ padding: "40px", maxWidth: "900px", textAlign: "left", margin: "0 auto" }}>
            <h2 className="textTitle" style={{ fontSize: "22px", marginBottom: "10px", fontFamily: "Georgia" }}>O hotelu</h2>
            <p className="text" style={{ marginTop: "10px", fontFamily: "Georgia", lineHeight: "1.6" }}>
                Hotel Bursztyn to nowoczesny obiekt oferujący komfortowe pokoje oraz szeroki zakres usług.
                Naszym celem jest zapewnienie najwyższej jakości wypoczynku w spokojnej i eleganckiej atmosferze.
                Oferujemy dostęp do restauracji, strefy spa oraz profesjonalnej obsługi przez całą dobę.
            </p>
        </div>
    </>
);

export default HeroSection;