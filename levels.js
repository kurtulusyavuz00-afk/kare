/* =========================================================
   LEVEL DATA
   Cevaplar TR veya EN olabilir.
   Kelime setleri ortak harf paylaşacak şekilde seçilmiştir.
========================================================= */

var LEVELS = [

    {
        id: 1,
        title: "Seviye 1",
        difficulty: "easy",
        gridSize: 17,
        words: [
            { id: "l1-sun", answer: "SUN", clue: "Gündüz gökyüzünü aydınlatan yıldız", language: "EN" },
            { id: "l1-sea", answer: "SEA", clue: "Tuzlu, geniş su kütlesi", language: "EN" },
            { id: "l1-net", answer: "NET", clue: "Balık tutmak için ağ", language: "EN" },
            { id: "l1-tea", answer: "TEA", clue: "Sıcak içilen bir içecek", language: "EN" },
            { id: "l1-eat", answer: "EAT", clue: "Besin tüketmek", language: "EN" }
        ]
    },

    {
        id: 2,
        title: "Seviye 2",
        difficulty: "easy",
        gridSize: 17,
        words: [
            { id: "l2-cat", answer: "CAT", clue: "Miyavlayan evcil hayvan", language: "EN" },
            { id: "l2-car", answer: "CAR", clue: "Dört tekerlekli taşıt", language: "EN" },
            { id: "l2-art", answer: "ART", clue: "Yaratıcı anlatım ve estetik üretim", language: "EN" },
            { id: "l2-rat", answer: "RAT", clue: "Küçük kemirgen", language: "EN" },
            { id: "l2-star", answer: "STAR", clue: "Gece gökyüzünde parlayan nokta", language: "EN" }
        ]
    },

    {
        id: 3,
        title: "Seviye 3",
        difficulty: "easy",
        gridSize: 17,
        words: [
            { id: "l3-book", answer: "BOOK", clue: "Okunan basılı eser", language: "EN" },
            { id: "l3-bird", answer: "BIRD", clue: "Kanatlı uçan hayvan", language: "EN" },
            { id: "l3-door", answer: "DOOR", clue: "Odaya girişi sağlayan yapı", language: "EN" },
            { id: "l3-rain", answer: "RAIN", clue: "Gökten düşen su damlaları", language: "EN" },
            { id: "l3-road", answer: "ROAD", clue: "Araçların gittiği yol", language: "EN" }
        ]
    },

    {
        id: 4,
        title: "Seviye 4",
        difficulty: "medium",
        gridSize: 19,
        words: [
            { id: "l4-night", answer: "NIGHT", clue: "Gündüzün zıttı", language: "EN" },
            { id: "l4-light", answer: "LIGHT", clue: "Karanlığı ortadan kaldıran şey", language: "EN" },
            { id: "l4-train", answer: "TRAIN", clue: "Ray üzerinde giden taşıt", language: "EN" },
            { id: "l4-water", answer: "WATER", clue: "İçtiğimiz renksiz sıvı", language: "EN" },
            { id: "l4-heart", answer: "HEART", clue: "Kan pompalayan organ", language: "EN" },
            { id: "l4-earth", answer: "EARTH", clue: "Yaşadığımız gezegen", language: "EN" }
        ]
    },

    {
        id: 5,
        title: "Seviye 5",
        difficulty: "medium",
        gridSize: 19,
        words: [
            { id: "l5-apple", answer: "APPLE", clue: "Kırmızı veya yeşil meyve", language: "EN" },
            { id: "l5-plane", answer: "PLANE", clue: "Gökyüzünde uçan taşıt", language: "EN" },
            { id: "l5-plant", answer: "PLANT", clue: "Toprakta yetişen canlı", language: "EN" },
            { id: "l5-paper", answer: "PAPER", clue: "Üzerine yazılan ince madde", language: "EN" },
            { id: "l5-ocean", answer: "OCEAN", clue: "Büyük su kütlesi", language: "EN" },
            { id: "l5-peace", answer: "PEACE", clue: "Savaşın olmadığı sakinlik durumu", language: "EN" }
        ]
    },

    {
        id: 6,
        title: "Seviye 6",
        difficulty: "medium",
        gridSize: 19,
        words: [
            { id: "l6-muzik", answer: "MUZIK", clue: "Nota ve ritim sanatı", language: "TR" },
            { id: "l6-deniz", answer: "DENIZ", clue: "Tuzlu büyük su", language: "TR" },
            { id: "l6-zihin", answer: "ZIHIN", clue: "Düşünce merkezi", language: "TR" },
            { id: "l6-zaman", answer: "ZAMAN", clue: "Saatle ölçülen kavram", language: "TR" },
            { id: "l6-insan", answer: "INSAN", clue: "Düşünebilen ve konuşabilen canlı", language: "TR" },
            { id: "l6-yildiz", answer: "YILDIZ", clue: "Gökyüzünde parlayan ışık kaynağı", language: "TR" }
        ]
    },

    {
        id: 7,
        title: "Seviye 7",
        difficulty: "medium",
        gridSize: 19,
        words: [
            { id: "l7-bridge", answer: "BRIDGE", clue: "İki yakayı birleştiren yapı", language: "EN" },
            { id: "l7-garden", answer: "GARDEN", clue: "Çiçek ve bitki yetiştirilen yer", language: "EN" },
            { id: "l7-orange", answer: "ORANGE", clue: "Turuncu renkli, turunçgil bir meyve", language: "EN" },
            { id: "l7-silver", answer: "SILVER", clue: "Takılarda kullanılan değerli bir metal", language: "EN" },
            { id: "l7-window", answer: "WINDOW", clue: "Camlı açıklık", language: "EN" },
            { id: "l7-school", answer: "SCHOOL", clue: "Eğitim verilen kurum", language: "EN" }
        ]
    },

    {
        id: 8,
        title: "Seviye 8",
        difficulty: "hard",
        gridSize: 19,
        words: [
            { id: "l8-memory", answer: "MEMORY", clue: "Geçmiş bilgileri akılda tutma yetisi", language: "EN" },
            { id: "l8-market", answer: "MARKET", clue: "Alışveriş yapılan yer", language: "EN" },
            { id: "l8-mirror", answer: "MIRROR", clue: "Yansıma gösteren yüzey", language: "EN" },
            { id: "l8-forest", answer: "FOREST", clue: "Ağaçlarla kaplı geniş alan", language: "EN" },
            { id: "l8-friend", answer: "FRIEND", clue: "Yakın dost", language: "EN" },
            { id: "l8-summer", answer: "SUMMER", clue: "En sıcak mevsim", language: "EN" },
            { id: "l8-winter", answer: "WINTER", clue: "En soğuk mevsim", language: "EN" }
        ]
    },

    {
        id: 9,
        title: "Seviye 9",
        difficulty: "hard",
        gridSize: 15,
        words: [
            { id: "l9-kitap", answer: "KITAP", clue: "Sayfalardan oluşan okuma aracı", language: "TR" },
            { id: "l9-kalem", answer: "KALEM", clue: "Yazı yazmaya yarayan araç", language: "TR" },
            { id: "l9-okul", answer: "OKUL", clue: "Öğrencilerin gittiği yer", language: "TR" },
            { id: "l9-renk", answer: "RENK", clue: "Görsel algıda ton (mavi, kırmızı...)", language: "TR" },
            { id: "l9-nehir", answer: "NEHIR", clue: "Akan tatlı su yolu", language: "TR" },
            { id: "l9-hikaye", answer: "HIKAYE", clue: "Anlatılan olaylar dizisi", language: "TR" },
            { id: "l9-kelime", answer: "KELIME", clue: "Anlam taşıyan dil birimi", language: "TR" }
        ]
    },

    {
        id: 10,
        title: "Seviye 10",
        difficulty: "hard",
        gridSize: 15,
        words: [
            { id: "l10-shadow", answer: "SHADOW", clue: "Işık engellendiğinde oluşan karanlık iz", language: "EN" },
            { id: "l10-island", answer: "ISLAND", clue: "Su ile çevrili kara parçası", language: "EN" },
            { id: "l10-silent", answer: "SILENT", clue: "Hiç ses çıkarmayan", language: "EN" },
            { id: "l10-candle", answer: "CANDLE", clue: "Fitili yakılarak ışık veren balmumu", language: "EN" },
            { id: "l10-castle", answer: "CASTLE", clue: "Ortaçağ kalesi", language: "EN" },
            { id: "l10-circle", answer: "CIRCLE", clue: "Yuvarlak geometrik şekil", language: "EN" },
            { id: "l10-silver", answer: "SILVER", clue: "Ag elementinin adı", language: "EN" }
        ]
    },

    {
        id: 11,
        title: "Seviye 11",
        difficulty: "hard",
        gridSize: 15,
        words: [
            { id: "l11-journey", answer: "JOURNEY", clue: "Uzun yolculuk", language: "EN" },
            { id: "l11-freedom", answer: "FREEDOM", clue: "Kişinin kendi kararlarını verebilme durumu", language: "EN" },
            { id: "l11-morning", answer: "MORNING", clue: "Günün başlangıcı", language: "EN" },
            { id: "l11-village", answer: "VILLAGE", clue: "Küçük yerleşim yeri", language: "EN" },
            { id: "l11-history", answer: "HISTORY", clue: "Geçmiş olaylar bilimi", language: "EN" },
            { id: "l11-mystery", answer: "MYSTERY", clue: "Henüz açıklanamamış, merak uyandıran durum", language: "EN" }
        ]
    },

    {
        id: 12,
        title: "Seviye 12",
        difficulty: "hard",
        gridSize: 15,
        words: [
            { id: "l12-bahce", answer: "BAHCE", clue: "Ev önündeki yeşil alan", language: "TR" },
            { id: "l12-cesme", answer: "CESME", clue: "Su akan yapı", language: "TR" },
            { id: "l12-cicek", answer: "CICEK", clue: "Renkli bitki organı", language: "TR" },
            { id: "l12-bulut", answer: "BULUT", clue: "Gökyüzündeki buhar kümesi", language: "TR" },
            { id: "l12-ruzgar", answer: "RUZGAR", clue: "Havanın hareketi", language: "TR" },
            { id: "l12-gokyuzu", answer: "GOKYUZU", clue: "Başımızın üstündeki mavi alan", language: "TR" },
            { id: "l12-yildiz", answer: "YILDIZ", clue: "Gece parlayan gök cismi", language: "TR" }
        ]
    },

    {
        id: 13,
        title: "Seviye 13",
        difficulty: "expert",
        gridSize: 15,
        words: [
            { id: "l13-whisper", answer: "WHISPER", clue: "Alçak sesle konuşmak", language: "EN" },
            { id: "l13-thunder", answer: "THUNDER", clue: "Şimşek sonrası duyulan gürültü", language: "EN" },
            { id: "l13-horizon", answer: "HORIZON", clue: "Gökyüzü ile yerin birleştiği çizgi", language: "EN" },
            { id: "l13-silence", answer: "SILENCE", clue: "Tam sessizlik hali", language: "EN" },
            { id: "l13-crystal", answer: "CRYSTAL", clue: "Saydam mineral yapı", language: "EN" },
            { id: "l13-Passage", answer: "PASSAGE", clue: "Bir yerden başka bir yere geçiş sağlayan yol", language: "EN" },
            { id: "l13-shelter", answer: "SHELTER", clue: "Korunma sağlayan yer", language: "EN" }
        ]
    },

    {
        id: 14,
        title: "Seviye 14",
        difficulty: "expert",
        gridSize: 15,
        words: [
            { id: "l14-measure", answer: "MEASURE", clue: "Bir şeyin boyutunu belirlemek", language: "EN" },
            { id: "l14-treasure", answer: "TREASURE", clue: "Değerli gizli birikim", language: "EN" },
            { id: "l14-venture", answer: "VENTURE", clue: "Riskli girişim", language: "EN" },
            { id: "l14-nature", answer: "NATURE", clue: "İnsan eli değmemiş canlı ve cansız çevre", language: "EN" },
            { id: "l14-capture", answer: "CAPTURE", clue: "Ele geçirmek", language: "EN" },
            { id: "l14-picture", answer: "PICTURE", clue: "Bir görüntüyü gösteren çizim veya fotoğraf", language: "EN" },
            { id: "l14-culture", answer: "CULTURE", clue: "Bir topluluğun paylaştığı yaşam biçimi", language: "EN" }
        ]
    },

    {
        id: 15,
        title: "Seviye 15",
        difficulty: "expert",
        gridSize: 15,
        words: [
            { id: "l15-dusunce", answer: "DUSUNCE", clue: "Zihinde oluşan fikir", language: "TR" },
            { id: "l15-umut", answer: "UMUT", clue: "İyimser beklenti", language: "TR" },
            { id: "l15-mutluluk", answer: "MUTLULUK", clue: "Sevinç hali", language: "TR" },
            { id: "l15-huzur", answer: "HUZUR", clue: "İçsel sakinlik", language: "TR" },
            { id: "l15-guven", answer: "GUVEN", clue: "İnanç ve emniyet duygusu", language: "TR" },
            { id: "l15-bilgi", answer: "BILGI", clue: "Öğrenilen şey", language: "TR" },
            { id: "l15-hayal", answer: "HAYAL", clue: "Zihinde canlandırılan görüntü", language: "TR" }
        ]
    },

    {
        id: 16,
        title: "Seviye 16",
        difficulty: "expert",
        gridSize: 15,
        words: [
            { id: "l16-eclipse", answer: "ECLIPSE", clue: "Güneş veya ayın örtülmesi", language: "EN" },
            { id: "l16-compass", answer: "COMPASS", clue: "Yön gösteren araç", language: "EN" },
            { id: "l16-balance", answer: "BALANCE", clue: "Karşıt güçlerin eşit durumda olması", language: "EN" },
            { id: "l16-courage", answer: "COURAGE", clue: "Korkuya rağmen davranabilme gücü", language: "EN" },
            { id: "l16-journey", answer: "JOURNEY", clue: "Bir yerden bir yere gidiş süreci", language: "EN" },
            { id: "l16-mystery", answer: "MYSTERY", clue: "Açıklanamayan durum", language: "EN" },
            { id: "l16-harmony", answer: "HARMONY", clue: "Birbiriyle uyumlu seslerin oluşturduğu ahenk", language: "EN" }
        ]
    },

    {
        id: 17,
        title: "Seviye 17",
        difficulty: "master",
        gridSize: 15,
        words: [
            { id: "l17-knowledge", answer: "KNOWLEDGE", clue: "Öğrenme yoluyla edinilen bilgi birikimi", language: "EN" },
            { id: "l17-adventure", answer: "ADVENTURE", clue: "Heyecanlı ve riskli deneyim", language: "EN" },
            { id: "l17-landscape", answer: "LANDSCAPE", clue: "Doğal manzara görünümü", language: "EN" },
            { id: "l17-challenge", answer: "CHALLENGE", clue: "Zorlayıcı görev", language: "EN" },
            { id: "l17-treasure", answer: "TREASURE", clue: "Saklanmış değerli şeyler", language: "EN" },
            { id: "l17-language", answer: "LANGUAGE", clue: "İletişim sistemi", language: "EN" }
        ]
    },

    {
        id: 18,
        title: "Seviye 18",
        difficulty: "master",
        gridSize: 15,
        words: [
            { id: "l18-felsefe", answer: "FELSEFE", clue: "Varlık ve bilgi üzerine düşünme", language: "TR" },
            { id: "l18-edebiyat", answer: "EDEBIYAT", clue: "Yazın sanatı", language: "TR" },
            { id: "l18-tarih", answer: "TARIH", clue: "Geçmişi inceleyen bilim", language: "TR" },
            { id: "l18-bilim", answer: "BILIM", clue: "Sistematik bilgi üretme", language: "TR" },
            { id: "l18-sanat", answer: "SANAT", clue: "Estetik yaratım", language: "TR" },
            { id: "l18-dilbilim", answer: "DILBILIM", clue: "Dili bilimsel inceleyen alan", language: "TR" },
            { id: "l18-kultur", answer: "KULTUR", clue: "Toplumun ortak değerleri", language: "TR" }
        ]
    },

    {
        id: 19,
        title: "Seviye 19",
        difficulty: "master",
        gridSize: 15,
        words: [
            { id: "l19-philosophy", answer: "PHILOSOPHY", clue: "Varlığın ve bilginin temelini sorgulayan düşünce alanı", language: "EN" },
            { id: "l19-symphony", answer: "SYMPHONY", clue: "Büyük orkestra yapıtı", language: "EN" },
            { id: "l19-mythical", answer: "MYTHICAL", clue: "Efsanelerde anlatılan, gerçekte bulunmayan", language: "EN" },
            { id: "l19-labyrinth", answer: "LABYRINTH", clue: "Karmaşık yollar labirenti", language: "EN" },
            { id: "l19-chronicle", answer: "CHRONICLE", clue: "Olayları sırayla anlatan kayıt", language: "EN" },
            { id: "l19-paradox", answer: "PARADOX", clue: "Çelişkili görünen doğru", language: "EN" }
        ]
    },

    {
        id: 20,
        title: "Seviye 20",
        difficulty: "master",
        gridSize: 15,
        words: [
            { id: "l20-enlightenment", answer: "ENLIGHTENMENT", clue: "Bilgi edinerek düşünsel gelişim sağlama", language: "EN" },
            { id: "l20-imagination", answer: "IMAGINATION", clue: "Zihinde yeni görüntüler ve fikirler kurma gücü", language: "EN" },
            { id: "l20-perspective", answer: "PERSPECTIVE", clue: "Bakış açısı", language: "EN" },
            { id: "l20-resilience", answer: "RESILIENCE", clue: "Zorluklara karşı dayanıklılık", language: "EN" },
            { id: "l20-inspiration", answer: "INSPIRATION", clue: "Yeni bir düşünce veya eser ortaya çıkaran etki", language: "EN" },
            { id: "l20-reflection", answer: "REFLECTION", clue: "Yansıma veya derin düşünme", language: "EN" }
        ]
    }

];

var EXTRA_WORDS_BY_LEVEL = {
    1: [
        ["ANT", "Çok küçük, altı bacaklı canlı"],
        ["NUT", "Kabuklu yemiş"],
        ["TEN", "Dokuzdan sonra gelen sayı"],
        ["USE", "Bir şeyi işe yarar biçimde kullanmak"],
        ["SAT", "Sandalyeye oturdu"]
    ],
    2: [
        ["TAR", "Yol yüzeyinde kullanılan siyah madde"],
        ["ACT", "Sahnede sergilenen bölüm"],
        ["CART", "Yük taşımaya yarayan küçük araç"],
        ["CAST", "Bir oyunda rol alan oyuncular"],
        ["SCAR", "Yara iyileştikten sonra kalan iz"]
    ],
    3: [
        ["BORN", "Dünyaya gelmiş"],
        ["BOAR", "Erkek yaban domuzu"],
        ["DRAIN", "Suyu dışarı akıtmak"],
        ["BOARD", "Düz ve uzun tahta parçası"],
        ["BARK", "Ağaç gövdesinin dış katmanı"]
    ],
    4: [
        ["WHITE", "Karın rengi"],
        ["RIGHT", "Solun karşı yönü"],
        ["WRITE", "Harflerle sözcük oluşturmak"],
        ["TIGER", "Çizgili kürkü olan yırtıcı kedi"]
    ],
    5: [
        ["PLACE", "Bir şeyin bulunduğu konum"],
        ["PANEL", "Düz ve geniş levha"],
        ["CLEAN", "Kirden arınmış"],
        ["PEAR", "Yeşil veya sarı, sulu meyve"]
    ],
    6: [
        ["KAPI", "Bir odaya giriş çıkış sağlayan kanat"],
        ["KAZ", "Uzun boyunlu, suda yaşayan kümes hayvanı"],
        ["YAZI", "Harflerle oluşturulan anlatım"],
        ["IZIN", "Bir şeyi yapmaya yönelik onay"]
    ],
    7: [
        ["GOLD", "Takı yapımında kullanılan sarı değerli metal"],
        ["GREEN", "Çimenin rengi"],
        ["WORD", "Anlam taşıyan dil birimi"],
        ["LION", "Yelesi olan büyük yırtıcı kedi"]
    ],
    8: [
        ["RIVER", "İki kıyı arasında akan tatlı su"],
        ["MOTHER", "Çocuğu olan kadın"],
        ["FAMILY", "Birbirine akrabalık bağıyla bağlı kişiler"]
    ],
    9: [
        ["KAPI", "Bir odaya giriş çıkış sağlayan kanat"],
        ["KART", "Üzerinde bilgi bulunan küçük, sert levha"],
        ["KIR", "Şehir dışındaki açık ve boş arazi"]
    ],
    10: [
        ["SILK", "İpek böceğinin ürettiği ince lif"],
        ["STAND", "Bir şeyi dik tutan destek"],
        ["COLD", "Düşük sıcaklıkta olan"]
    ],
    11: [
        ["HORSE", "Binilebilen, toynaklı çiftlik hayvanı"],
        ["STORY", "Olayları anlatan yazı veya öykü"],
        ["FRIEND", "Yakınlık kurulan, sevilen kişi"],
        ["HOLIDAY", "Dinlenmek için işe ara verilen gün"]
    ],
    12: [
        ["GUNES", "Dünyamızı aydınlatan yıldız"],
        ["DAG", "Çevresinden yüksek doğal yer şekli"],
        ["YAGMUR", "Bulutlardan düşen su damlaları"]
    ],
    13: [
        ["THRONE", "Hükümdarın oturduğu gösterişli koltuk"],
        ["SHINE", "Işık vererek parlamak"],
        ["TREASURE", "Çok değerli eşya veya birikim"]
    ],
    14: [
        ["FEATURE", "Bir şeyi ayırt eden belirgin özellik"],
        ["RETURN", "Bir yere yeniden gelmek"],
        ["CREATE", "Yeni bir şey ortaya çıkarmak"]
    ],
    15: [
        ["SEVGI", "Birine karşı duyulan güçlü yakınlık"],
        ["DOST", "Güvenilen yakın arkadaş"],
        ["GULUS", "Gülümserken yüzde oluşan ifade"]
    ],
    16: [
        ["CHANCE", "Bir şeyin gerçekleşme olasılığı"],
        ["SCIENCE", "Gözlem ve deneyle bilgi üreten alan"],
        ["SILENCE", "Hiç sesin duyulmadığı durum"]
    ],
    17: [
        ["EDGE", "Bir nesnenin sınır oluşturan keskin yanı"],
        ["ELEGANT", "Zarif ve ince görünümlü"],
        ["DANGER", "Zarar görme ihtimali"],
        ["NATURE", "Canlı ve cansız doğal çevrenin bütünü"]
    ],
    18: [
        ["FIKIR", "Zihinde oluşan düşünce"],
        ["OGRENME", "Bilgi veya beceri edinme süreci"],
        ["TOPLUM", "Ortak yaşam sürdüren insan topluluğu"]
    ],
    19: [
        ["ORCHESTRA", "Birlikte çalan müzisyen topluluğu"],
        ["SYMBOL", "Bir düşünceyi temsil eden işaret"],
        ["LYRIC", "Bir şarkının söz bölümü"],
        ["LOGIC", "Doğru düşünme kuralları"]
    ],
    20: [
        ["MIND", "Düşünme ve anlama yetisi"],
        ["VISION", "Geleceğe yönelik amaç veya tasarı"],
        ["THOUGHT", "Zihinde oluşan düşünce"],
        ["CREATIVE", "Yeni ve özgün fikirler üretebilen"]
    ]
};

LEVELS.forEach((level) => {
    const language = level.words[0].language || "EN";
    (EXTRA_WORDS_BY_LEVEL[level.id] || []).forEach(([answer, clue], index) => {
        level.words.push({
            id: `l${level.id}-extra-${index + 1}`,
            answer,
            clue,
            language
        });
    });

    level.gridSize = level.id <= 3 ? 17 : level.id <= 8 ? 19 : level.id <= 16 ? 21 : 23;
});

function getLevelById(id) {
    return LEVELS.find((level) => level.id === id) || null;
}

function getTotalLevelCount() {
    return LEVELS.length;
}
