export const panos2Batch = {
    name: "panos2",
    panoramas: [
        { source: "IMG_3161.HEIC", slug: "st-marks-basilica-venice", title: "St Mark’s Basilica, Venice", country: "italy", date: "2024-02-08", latitude: 45.43472222222222, longitude: 12.339002777777779, width: 14966, height: 3788, alt: "Panoramic view of St Mark’s Basilica and Campanile in Venice" },
        { source: "IMG_3191.HEIC", slug: "canal-frezzaria-venice", title: "Canal near Frezzaria, Venice", country: "italy", date: "2024-02-08", latitude: 45.43420833333333, longitude: 12.334861111111111, width: 8486, height: 3894, alt: "Panoramic view of a canal near Frezzaria in Venice" },
        { source: "IMG_3320.HEIC", slug: "gondolas-grand-canal-venice", title: "Gondolas on the Grand Canal, Venice", country: "italy", date: "2024-02-09", latitude: 45.437241666666665, longitude: 12.334050000000001, width: 7704, height: 3786, alt: "Panoramic view of gondolas on the Grand Canal in Venice" },
        { source: "IMG_3323.HEIC", slug: "grand-canal-riva-del-vin", title: "Grand Canal from Riva del Vin, Venice", country: "italy", date: "2024-02-09", latitude: 45.43757222222222, longitude: 12.334772222222222, width: 7904, height: 3900, alt: "Panoramic view of the Grand Canal from Riva del Vin in Venice" },
        { source: "IMG_3479.HEIC", slug: "giudecca-canal-dorsoduro", title: "Giudecca Canal from Dorsoduro, Venice", country: "italy", date: "2024-02-09", latitude: 45.42853888888889, longitude: 12.332941666666667, width: 8676, height: 3820, alt: "Panoramic view of the Giudecca Canal from Dorsoduro in Venice" },
        { source: "IMG_3982.HEIC", slug: "florence-viale-giuseppe-poggi", title: "Florence from Viale Giuseppe Poggi", country: "italy", date: "2024-02-12", latitude: 43.76374166666667, longitude: 11.264563888888889, width: 8958, height: 3900, alt: "Panoramic view of Florence and Torre San Niccolò from Viale Giuseppe Poggi" },
        { source: "IMG_4031.HEIC", slug: "florence-ponte-vecchio-piazzale-michelangelo", title: "Florence and Ponte Vecchio from Piazzale Michelangelo", country: "italy", date: "2024-02-12", latitude: 43.763225, longitude: 11.264105555555556, width: 13768, height: 3920, alt: "Panoramic view of Florence and Ponte Vecchio from Piazzale Michelangelo" },
        { source: "IMG_4355.HEIC", slug: "circus-maximus-palatine-hill", title: "Circus Maximus and Palatine Hill, Rome", country: "italy", date: "2024-02-16", latitude: 41.88559722222222, longitude: 12.485141666666665, width: 16284, height: 3888, alt: "Panoramic view of Circus Maximus and Palatine Hill in Rome" },
        { source: "IMG_4546.HEIC", slug: "imperial-fora-vittoriano", title: "Imperial Fora from the Vittoriano, Rome", country: "italy", date: "2024-02-16", latitude: 41.89459166666666, longitude: 12.483838888888888, width: 13374, height: 3914, alt: "Panoramic view of the Imperial Fora from the Vittoriano in Rome" },
        { source: "IMG_4753.HEIC", slug: "roman-forum-septimius-severus", title: "Roman Forum and Arch of Septimius Severus", country: "italy", date: "2024-02-17", latitude: 41.892916666666665, longitude: 12.48501111111111, width: 10126, height: 3920, alt: "Panoramic view of the Roman Forum and Arch of Septimius Severus" },
        { source: "IMG_5514.HEIC", slug: "puerto-cruz-atlantic-coast", title: "Atlantic Coast at Puerto de la Cruz", country: "spain", date: "2024-04-21", latitude: 28.416644444444444, longitude: -16.55725, width: 9958, height: 3820, alt: "Panoramic view of the Atlantic coast at Puerto de la Cruz in Tenerife" },
    ],
    excludedSources: [
        {
            source: "IMG_4032.HEIC",
            duplicateOf: "IMG_4031.HEIC",
            forbiddenSlug: "florence-skyline-piazzale-michelangelo",
            reason: "Same Piazzale Michelangelo viewpoint and skyline, captured 0.7 m apart",
        },
    ],
};
