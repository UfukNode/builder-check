// What someone can build in each language, keyed by the language name GitHub shows.
// General kinds of work only: no project, company or platform is named.

const IDEAS = {
  TypeScript: {
    en: [
      "Web apps with a typed front end and back end",
      "Browser extensions",
      "Command-line tools and packages others can install",
      "Bots and integrations around public APIs",
    ],
    tr: [
      "Ön yüzü ve arka ucu tipli web uygulamaları",
      "Tarayıcı eklentileri",
      "Komut satırı araçları ve başkalarının kurabileceği paketler",
      "Açık API'ler etrafında botlar ve entegrasyonlar",
    ],
  },
  JavaScript: {
    en: ["Interactive websites and web apps", "Browser extensions and userscripts", "Server scripts and small back ends", "Libraries others can install"],
    tr: ["Etkileşimli siteler ve web uygulamaları", "Tarayıcı eklentileri ve userscript'ler", "Sunucu betikleri ve küçük arka uçlar", "Başkalarının kurabileceği kütüphaneler"],
  },
  Python: {
    en: ["Automation scripts and bots", "Data analysis, reports and charts", "Web APIs and back ends", "Machine learning experiments"],
    tr: ["Otomasyon betikleri ve botlar", "Veri analizi, raporlar ve grafikler", "Web API'leri ve arka uçlar", "Makine öğrenmesi denemeleri"],
  },
  Rust: {
    en: ["Fast command-line tools", "Back-end services where speed and safety matter", "Libraries other languages can call", "WebAssembly modules for the browser"],
    tr: ["Hızlı komut satırı araçları", "Hızın ve güvenliğin önemli olduğu arka uç servisleri", "Başka dillerin çağırabildiği kütüphaneler", "Tarayıcı için WebAssembly modülleri"],
  },
  Go: {
    en: ["Web servers and APIs", "Command-line tools shipped as a single file", "Cloud and DevOps tooling", "Network services and proxies"],
    tr: ["Web sunucuları ve API'ler", "Tek dosya olarak dağıtılan komut satırı araçları", "Bulut ve DevOps araçları", "Ağ servisleri ve proxy'ler"],
  },
  Java: {
    en: ["Back-end services and APIs", "Android apps", "Desktop applications", "Libraries for the JVM"],
    tr: ["Arka uç servisleri ve API'ler", "Android uygulamaları", "Masaüstü uygulamaları", "JVM için kütüphaneler"],
  },
  Kotlin: {
    en: ["Android apps", "Back-end services", "Libraries shared across platforms", "Build plugins and developer tooling"],
    tr: ["Android uygulamaları", "Arka uç servisleri", "Platformlar arası ortak kütüphaneler", "Derleme eklentileri ve geliştirici araçları"],
  },
  Swift: {
    en: ["iPhone and iPad apps", "Mac apps", "Widgets and app extensions", "Packages other apps can use"],
    tr: ["iPhone ve iPad uygulamaları", "Mac uygulamaları", "Widget'lar ve uygulama eklentileri", "Başka uygulamaların kullanabileceği paketler"],
  },
  C: {
    en: ["Firmware for microcontrollers and embedded devices", "Operating system and driver code", "Small, fast libraries", "Command-line utilities"],
    tr: ["Mikrodenetleyiciler ve gömülü cihazlar için firmware", "İşletim sistemi ve sürücü kodu", "Küçük ve hızlı kütüphaneler", "Komut satırı yardımcıları"],
  },
  "C++": {
    en: ["Games and game engines", "Performance-critical libraries", "Desktop applications", "Robotics and embedded software"],
    tr: ["Oyunlar ve oyun motorları", "Performansın kritik olduğu kütüphaneler", "Masaüstü uygulamaları", "Robotik ve gömülü yazılım"],
  },
  "C#": {
    en: ["Games", "Windows desktop apps", "Web back ends and APIs", "Cross-platform apps"],
    tr: ["Oyunlar", "Windows masaüstü uygulamaları", "Web arka uçları ve API'ler", "Platformlar arası uygulamalar"],
  },
  PHP: {
    en: ["Websites and content sites", "Web back ends and APIs", "Plugins and themes", "Online store features"],
    tr: ["Web siteleri ve içerik siteleri", "Web arka uçları ve API'ler", "Eklentiler ve temalar", "Online mağaza özellikleri"],
  },
  Ruby: {
    en: ["Web apps and APIs", "Automation scripts", "Libraries others can install", "Developer tooling"],
    tr: ["Web uygulamaları ve API'ler", "Otomasyon betikleri", "Başkalarının kurabileceği kütüphaneler", "Geliştirici araçları"],
  },
  Solidity: {
    en: ["Smart contracts", "Tests and security reviews for contracts", "Token and NFT contracts", "Deployment and contract tooling scripts"],
    tr: ["Akıllı kontratlar", "Kontratlar için test ve güvenlik incelemesi", "Token ve NFT kontratları", "Dağıtım ve kontrat araç betikleri"],
  },
  Move: {
    en: ["Smart contracts", "On-chain modules others can reuse", "Tests for contracts"],
    tr: ["Akıllı kontratlar", "Başkalarının kullanabileceği zincir üstü modüller", "Kontrat testleri"],
  },
  Cairo: {
    en: ["Smart contracts", "Provable programs", "Tests for contracts"],
    tr: ["Akıllı kontratlar", "Kanıtlanabilir programlar", "Kontrat testleri"],
  },
  Shell: {
    en: ["Install and setup scripts", "Server and deploy automation", "Command-line helpers", "CI scripts"],
    tr: ["Kurulum betikleri", "Sunucu ve dağıtım otomasyonu", "Komut satırı yardımcıları", "CI betikleri"],
  },
  HTML: {
    en: ["Landing pages and personal sites", "Documentation sites", "Accessible page layouts", "Email templates"],
    tr: ["Tanıtım sayfaları ve kişisel siteler", "Dokümantasyon siteleri", "Erişilebilir sayfa düzenleri", "E-posta şablonları"],
  },
  CSS: {
    en: ["Themes and design systems", "Responsive layouts", "Animations and transitions", "Accessible styling"],
    tr: ["Temalar ve tasarım sistemleri", "Her ekrana uyan sayfa düzenleri", "Animasyonlar ve geçişler", "Erişilebilir stiller"],
  },
  "Web UI": {
    en: ["Web apps and dashboards", "Reusable interface components", "Fast static sites", "Admin panels"],
    tr: ["Web uygulamaları ve paneller", "Tekrar kullanılabilir arayüz bileşenleri", "Hızlı statik siteler", "Yönetim panelleri"],
  },
  Dart: {
    en: ["Mobile apps for iOS and Android from one code base", "Desktop and web apps", "Packages others can install"],
    tr: ["Tek kod tabanından iOS ve Android uygulamaları", "Masaüstü ve web uygulamaları", "Başkalarının kurabileceği paketler"],
  },
  "Jupyter Notebook": {
    en: ["Data exploration and reports", "Machine learning experiments", "Tutorials with runnable code", "Charts and visual analysis"],
    tr: ["Veri keşfi ve raporlar", "Makine öğrenmesi denemeleri", "Çalıştırılabilir kodlu eğitimler", "Grafikler ve görsel analiz"],
  },
  R: {
    en: ["Statistical analysis", "Data visualizations", "Reproducible reports"],
    tr: ["İstatistiksel analiz", "Veri görselleştirmeleri", "Tekrarlanabilir raporlar"],
  },
  Scala: {
    en: ["Data processing pipelines", "Back-end services", "Functional libraries"],
    tr: ["Veri işleme hatları", "Arka uç servisleri", "Fonksiyonel kütüphaneler"],
  },
  Elixir: {
    en: ["Real-time web apps", "Back ends that keep running when one part fails", "Chat and messaging systems"],
    tr: ["Gerçek zamanlı web uygulamaları", "Bir parçası çökse de çalışmaya devam eden arka uçlar", "Sohbet ve mesajlaşma sistemleri"],
  },
  Haskell: {
    en: ["Compilers and language tools", "Type-safe back ends", "Libraries"],
    tr: ["Derleyiciler ve dil araçları", "Tip güvenli arka uçlar", "Kütüphaneler"],
  },
  Lua: {
    en: ["Game scripting and mods", "Editor plugins", "Scripting built into apps"],
    tr: ["Oyun betikleri ve modlar", "Editör eklentileri", "Uygulamalara gömülü betikler"],
  },
  Zig: {
    en: ["Systems programming", "Fast command-line tools", "Code that works with C libraries"],
    tr: ["Sistem programlama", "Hızlı komut satırı araçları", "C kütüphaneleriyle çalışan kod"],
  },
  Dockerfile: {
    en: ["Container images", "Reproducible development environments", "Deploy setups"],
    tr: ["Container imajları", "Tekrarlanabilir geliştirme ortamları", "Dağıtım kurulumları"],
  },
  HCL: {
    en: ["Infrastructure as code", "Cloud setups others can reuse"],
    tr: ["Kod olarak altyapı", "Başkalarının kullanabileceği bulut kurulumları"],
  },
};

// GitHub names that share a list with a close relative.
const SAME_AS = { SCSS: "CSS", Sass: "CSS", Less: "CSS", Vue: "Web UI", Svelte: "Web UI", Astro: "Web UI", PowerShell: "Shell" };

const GENERAL = {
  en: (language) => [`Small tools and scripts in ${language}`, `Fixes and tests for ${language} projects you use`, `Examples others can learn ${language} from`],
  tr: (language) => [`${language} ile küçük araçlar ve betikler`, `Kullandığın ${language} projelerine düzeltme ve test`, `Başkalarının ${language} öğrenebileceği örnekler`],
};

export function ideasFor(language, lang) {
  const ideas = IDEAS[SAME_AS[language] || language];
  return ideas ? ideas[lang] : GENERAL[lang](language);
}
