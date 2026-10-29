// English and Turkish copy. Sentences with counts are functions so each language can build its own grammar.

const plural = (count, one, many) => (count === 1 ? one : many);

export const LOCALES = { en: "en-GB", tr: "tr-TR" };

export const copy = {
  en: {
    pageTitle: "Builder Check",
    headline: "Read your GitHub, language by language.",
    lede:
      "Enter a username. Builder Check counts commit days, merged pull requests and your own repositories, marks activity that can look automated, and shows what you can build in each language you use.",
    usernameLabel: "GitHub username",
    usernamePlaceholder: "username",
    check: "Check",
    checking: "Checking",
    tokenSummary: "Use a token (optional)",
    tokenHelp:
      "Without a token GitHub allows 10 searches a minute and 60 requests an hour. A fine-grained token with no extra permissions raises both. It stays in this tab's memory and is sent only to api.github.com.",
    tokenLabel: "Token",
    tokenLink: "Create a token on GitHub",
    privacy: "Reads public GitHub data only. Nothing is saved.",

    statusProfile: "Reading the profile",
    statusActivity: "Reading pull requests, repositories and commits",
    statusCommits: (v) => `Reading commits, page ${v.page} of up to ${v.pages}`,
    statusLanguages: "Reading repository languages",
    statusWait: (v) => `GitHub allows 10 searches a minute without a token. Continuing in ${v.seconds} s.`,

    errorInvalid: "Enter a GitHub username, like UfukNode or github.com/UfukNode.",
    errorNotFound: (v) => `There is no GitHub user named ${v.login}. Check the spelling.`,
    errorOrg: (v) => `${v.login} is an organization. Builder Check reads personal accounts.`,
    errorRate: (v) =>
      v.authenticated
        ? `GitHub's limit for this token is used up. It resets at ${v.time}.`
        : `GitHub's limit for requests without a token is used up. It resets at ${v.time}. Add a token to continue now.`,
    errorToken: "GitHub rejected the token. Check it, or clear the field to continue without one.",
    errorNetwork: "Could not reach api.github.com. Check your connection and try again.",
    errorOther: (v) => `Something went wrong: ${v.message}`,

    since: (v) => `on GitHub since ${v.date}`,
    age: (v) =>
      [v.years ? `${v.years} ${plural(v.years, "year", "years")}` : "", v.months ? `${v.months} ${plural(v.months, "month", "months")}` : ""]
        .filter(Boolean)
        .join(", ") || "less than a month",

    stripLabel: (v) => `Commits per day from ${v.from} to ${v.to}`,
    legendCommits: "Commits that day",
    legendHeavy: "50 or more in one day",
    legendMerged: "Pull request merged",
    legendUnread: "Not read",
    coverage: (v) =>
      `Read the latest ${v.read} of ${v.total} commits, back to ${v.date}.${v.authenticated ? "" : " A token reads up to 1,000."}`,
    dayTitle: (v) => `${v.date}: ${v.count} ${plural(v.count, "commit", "commits")}`,
    mergeTitle: (v) => `${v.date}: ${v.count} ${plural(v.count, "pull request", "pull requests")} merged`,

    readingTitle: "The reading",
    copyReading: "Copy the reading",
    copied: "Copied",
    readingCommits: (v) =>
      v.days === 0
        ? `${v.login} has no public commits in the last 12 months.`
        : `${v.partialFrom ? `Back to ${v.partialFrom}, as far as was read,` : "In the last 12 months"} ${v.login} committed on ${v.n(v.days)} ${plural(v.days, "day", "days")} across ${v.n(v.weeks)} ${plural(v.weeks, "week", "weeks")}.`,
    readingPrs: (v) =>
      v.merged === 0
        ? "No pull requests have been merged into other people's repositories yet."
        : `${v.m(v.merged)} ${plural(v.merged, "pull request was", "pull requests were")} merged into other people's repositories.`,
    readingRepos: (v) =>
      v.count === 0
        ? `${v.login} has no public repositories yet, apart from forks.`
        : `The ${v.n(v.count)} public ${plural(v.count, "repository", "repositories")} ${v.login} owns ${plural(v.count, "has", "have")} ${v.n(v.stars)} ${plural(v.stars, "star", "stars")} and ${v.n(v.forks)} ${plural(v.forks, "fork", "forks")}.`,
    readingLanguages: (v) => (v.others ? `Most of the work is in ${v.main}, then ${v.others}.` : `Most of the work is in ${v.main}.`),
    readingPatterns: (v) =>
      v.found === 0
        ? "Nothing in this activity reads as automated."
        : `${v.n(v.found)} ${plural(v.found, "pattern", "patterns")} can read as automated, listed below.`,
    notAScore: "This is not a score. Every number is a count from public GitHub data.",
    source: "source",

    languagesTitle: "What you can do in each language",
    languagesWhy:
      "Each repository counts in the main language GitHub shows for it: your own repositories, the ones you committed to in the last 12 months, and the ones that merged your pull requests.",
    languagesEmpty: "No language to read yet: there are no public repositories or commits with a language.",
    roles: { main: "Main language", regular: "Regular", occasional: "Now and then" },
    langDays: (v) =>
      v.partialFrom
        ? `${v.n(v.days)} commit ${plural(v.days, "day", "days")} back to ${v.partialFrom}.`
        : `${v.n(v.days)} commit ${plural(v.days, "day", "days")} in the last 12 months.`,
    langRepos: (v) =>
      `${v.n(v.repos)} own ${plural(v.repos, "repository", "repositories")}${v.stars ? ` with ${v.n(v.stars)} ${plural(v.stars, "star", "stars")}` : ""}.`,
    langMerged: (v) => `${v.n(v.merged)} ${plural(v.merged, "pull request", "pull requests")} merged in other people's repositories.`,
    canBuild: "You can build",
    nextLabel: "Next",
    next: {
      maintain: (v) => `Your ${v.name} repositories already have users. Write a short guide for the most starred one and keep answering its issues.`,
      start: (v) => `Build one small ${v.name} project from start to finish and put it in a public repository with a README.`,
      ownTool: (v) => `Your ${v.name} work is merged in other people's projects. Build a small ${v.name} tool of your own next.`,
      contribute: (v) => `You can send fixes and tests to ${v.name} projects you already use.`,
      review: (v) => `Review pull requests in the ${v.name} projects that merged your work. Reviews show on your profile too.`,
      deepen: (v) => `Take one ${v.name} project further: tests, a tagged release and a changelog.`,
      showcase: (v) => `Pick your best ${v.name} repository and give it a clear README with screenshots and a short example.`,
      rhythm: (v) => `Keep a steady ${v.name} rhythm: a few days every week shows more than one long day.`,
    },
    alsoUsed: (v) => `Also used: ${v.list}.`,

    improveTitle: "Make your GitHub better",
    improveWhy: "Focus on these first, in this order. Each one comes from a count on your profile.",
    improveNone: "Nothing obvious to fix. Keep the same rhythm.",
    improve: {
      patterns: {
        title: "Stop the activity marked above",
        detail: (v) =>
          `${v.n(v.count)} ${plural(v.count, "pattern", "patterns")} can read as automated. Repeated or bulk activity makes the rest of the profile harder to trust.`,
      },
      profileReadme: {
        title: "Add a profile README",
        detail: (v) => `A public repository named ${v.login} shows its README at the top of your profile. You do not have one yet.`,
      },
      profile: {
        title: "Fill in your profile",
        detail: (v) =>
          v.bio && v.link
            ? "Your profile has no bio and no link. One line on what you build and a link to your site or a social account help people place your work."
            : v.bio
              ? "Your profile has no bio. One line on what you build helps people place your work."
              : "Your profile has no link. Add your site or a social account.",
      },
      descriptions: {
        title: "Describe your repositories",
        detail: (v) =>
          `${v.n(v.count)} of your ${v.n(v.total)} ${plural(v.total, "repository has", "repositories have")} no description. One line each makes your repository list readable.`,
      },
      license: {
        title: "Add licenses",
        detail: (v) => `${v.n(v.count)} repositories with code have no license, so others cannot tell whether they may use it.`,
      },
      topics: {
        title: "Add topics",
        detail: (v) => `${v.n(v.count)} repositories have no topics. Topics put them on GitHub's topic pages and in search.`,
      },
      stale: {
        title: "Archive what you no longer work on",
        detail: (v) => `${v.n(v.count)} repositories have not changed in over a year. Archiving them lets the active ones stand out.`,
      },
      rhythm: {
        title: "Work in more weeks",
        detail: (v) => `${v.n(v.weeks)} of the last 52 weeks have commits. A few days every week reads better than bursts.`,
      },
      firstMerge: {
        title: "Get a first pull request merged",
        detail: () => "None of your pull requests to other people's repositories has been merged yet. Start with a small fix in a project you use.",
      },
      reviews: {
        title: "Review other people's pull requests",
        detail: () => "You have no reviews on pull requests in other people's repositories yet. Reviews show on your profile as contributions.",
      },
    },

    promptTitle: "Get ideas from an AI",
    promptWhy:
      "Copy this prompt into any AI assistant. It carries the counts above and asks for project ideas, profile fixes and a four-week plan. You can edit it first.",
    copyPrompt: "Copy the prompt",
    prompt: (v) => {
      const lines = [
        `I want ideas to make my GitHub stronger. These are the public numbers on my GitHub account ${v.login}, read on ${v.date}:`,
        "",
        `- On GitHub since ${v.since}.`,
        v.days === 0
          ? "- No public commits in the last 12 months."
          : `- Commits on ${v.n(v.days)} ${plural(v.days, "day", "days")} across ${v.n(v.weeks)} ${plural(v.weeks, "week", "weeks")} ${v.partialFrom ? `back to ${v.partialFrom}, as far as was read` : "in the last 12 months"}.`,
        `- In other people's repositories: ${v.n(v.merged)} merged ${plural(v.merged, "pull request", "pull requests")}, ${v.n(v.reviews)} ${plural(v.reviews, "review", "reviews")} and ${v.n(v.issues)} ${plural(v.issues, "issue", "issues")} opened.`,
        `- ${v.n(v.repos)} own public ${plural(v.repos, "repository", "repositories")} with ${v.n(v.stars)} ${plural(v.stars, "star", "stars")} and ${v.n(v.forks)} ${plural(v.forks, "fork", "forks")}.`,
      ];
      if (v.languages.length) {
        lines.push("", "Languages, most used first:");
        for (const l of v.languages) {
          const parts = [
            l.days && `${v.n(l.days)} commit ${plural(l.days, "day", "days")}`,
            l.repos && `${v.n(l.repos)} own ${plural(l.repos, "repository", "repositories")}${l.stars ? ` with ${v.n(l.stars)} ${plural(l.stars, "star", "stars")}` : ""}`,
            l.merged && `${v.n(l.merged)} merged ${plural(l.merged, "pull request", "pull requests")}`,
          ].filter(Boolean);
          lines.push(`- ${l.name}: ${parts.join(", ")}`);
        }
      }
      if (v.topRepos.length) {
        lines.push("", "My most starred repositories:");
        for (const r of v.topRepos) {
          const about = [r.language, `${v.n(r.stars)} ${plural(r.stars, "star", "stars")}`].filter(Boolean).join(", ");
          lines.push(`- ${r.name} (${about})${r.description ? `: ${r.description}` : ""}`);
        }
      }
      if (v.improve.length) {
        lines.push("", "What looks weak right now:");
        for (const item of v.improve) lines.push(`- ${item}`);
      }
      lines.push(
        "",
        "Please give me:",
        "1. Five project ideas that fit my languages and level. For each: a name, what it does, who would use it, why it suits me, and the first three steps.",
        "2. Changes to my existing repositories and profile, ordered by impact.",
        "3. A four-week plan for a few hours a week.",
        "",
        "Keep everything realistic for one person working alone. Do not suggest fake or automated activity to make the profile look busier.",
      );
      return lines.join("\n");
    },

    prsTitle: "Merged into other people's repositories",
    prsEmpty: "None yet.",
    prsOther: (v) =>
      `In other people's repositories: ${v.n(v.open)} open ${plural(v.open, "pull request", "pull requests")}, ${v.n(v.closed)} closed without merge, ${v.n(v.reviews)} ${plural(v.reviews, "review", "reviews")} and ${v.n(v.issues)} ${plural(v.issues, "issue", "issues")} opened.`,
    prsPartial: (v) => `The list shows the ${v.read} most recent merged pull requests.`,
    moreRepos: (v) => `${v.n(v.count)} more ${plural(v.count, "repository", "repositories")}.`,
    colRepo: "Repository",
    colLanguage: "Language",
    colMerged: "Merged",
    colLastMerge: "Last merge",
    colStars: "Stars",
    colForks: "Forks",

    toolsTitle: "Own repositories",
    toolsEmpty: "No public repositories of their own yet. Forks are not counted here.",
    toolsMore: (v) => `${v.n(v.count)} more ${plural(v.count, "repository", "repositories")} not shown. Forks are not counted.`,
    toolsNoMore: "Forks are not counted.",
    toolsPartial: (v) => `Read the ${v.n(v.read)} most recently pushed of ${v.n(v.total)} public repositories.`,

    patternsTitle: "What can read as automated",
    patternsWhy: "Repeated or bulk activity can make a profile look automated to anyone who reads it. GitHub's own rules also forbid fake activity.",
    clear: "None",
    foundLabel: "Found",
    patterns: {
      series: {
        title: "One commit message repeated within a day",
        found: (v) => `${v.n(v.count)} commits inside 24 hours read “${v.example}”.`,
      },
      heavy: {
        title: "50 or more commits in one day",
        found: (v) => `${v.n(v.days)} ${plural(v.days, "day", "days")}, the busiest ${v.date} with ${v.n(v.count)} commits.`,
      },
      bulk: {
        title: "Many repositories created on one day",
        found: (v) => `${v.n(v.count)} repositories on ${v.date}.`,
      },
      empty: {
        title: "Empty repositories",
        found: (v) => `${v.n(v.count)} repositories have no content.`,
      },
      typo: {
        title: "Typo pull requests",
        found: (v) => `${v.n(v.count)} of ${v.n(v.total)} pull requests to other people mention typos in the title.`,
      },
    },

    footerTitle: "How this works",
    footerBody:
      "Builder Check reads public data from the GitHub API: the profile, own repositories, pull requests and issues in other people's repositories, and commits from the last 12 months. A repository's language is the main language GitHub shows for it.",
    footerNote: "Nothing is saved. The page talks only to api.github.com.",
  },

  tr: {
    pageTitle: "Builder Check",
    headline: "GitHub'ını dil dil oku.",
    lede:
      "Bir kullanıcı adı yaz. Builder Check commit atılan günleri, merge olan PR'ları ve kendi repolarını sayar, otomatik görünebilecek aktiviteyi işaretler ve kullandığın her dilde neler yapabileceğini gösterir.",
    usernameLabel: "GitHub kullanıcı adı",
    usernamePlaceholder: "kullanıcı adı",
    check: "Kontrol et",
    checking: "Kontrol ediliyor",
    tokenSummary: "Token kullan (isteğe bağlı)",
    tokenHelp:
      "Token olmadan GitHub dakikada 10 aramaya ve saatte 60 isteğe izin verir. Ek izni olmayan bir fine-grained token ikisini de yükseltir. Token sadece bu sekmenin belleğinde durur ve yalnızca api.github.com'a gönderilir.",
    tokenLabel: "Token",
    tokenLink: "GitHub'da token oluştur",
    privacy: "Sadece herkese açık GitHub verisini okur. Hiçbir şey kaydedilmez.",

    statusProfile: "Profil okunuyor",
    statusActivity: "PR'lar, repolar ve commit'ler okunuyor",
    statusCommits: (v) => `Commit'ler okunuyor, sayfa ${v.page}/${v.pages}`,
    statusLanguages: "Repo dilleri okunuyor",
    statusWait: (v) => `GitHub token olmadan dakikada 10 aramaya izin veriyor. ${v.seconds} sn sonra devam edilecek.`,

    errorInvalid: "Bir GitHub kullanıcı adı yaz, örneğin UfukNode ya da github.com/UfukNode.",
    errorNotFound: (v) => `${v.login} adında bir GitHub kullanıcısı yok. Yazımı kontrol et.`,
    errorOrg: (v) => `${v.login} bir organizasyon. Builder Check kişisel hesapları okur.`,
    errorRate: (v) =>
      v.authenticated
        ? `Bu token için GitHub limiti doldu. Saat ${v.time} itibarıyla yenilenir.`
        : `GitHub'ın tokensız istek limiti doldu. Saat ${v.time} itibarıyla yenilenir. Hemen devam etmek için token ekle.`,
    errorToken: "GitHub token'ı kabul etmedi. Kontrol et ya da alanı boşaltıp tokensız devam et.",
    errorNetwork: "api.github.com'a ulaşılamadı. Bağlantını kontrol edip tekrar dene.",
    errorOther: (v) => `Bir şeyler ters gitti: ${v.message}`,

    since: (v) => `${v.date} tarihinden beri GitHub'da`,
    age: (v) => [v.years ? `${v.years} yıl` : "", v.months ? `${v.months} ay` : ""].filter(Boolean).join(" ") || "bir aydan kısa",

    stripLabel: (v) => `${v.from} ile ${v.to} arasında günlük commit`,
    legendCommits: "O günkü commit'ler",
    legendHeavy: "Bir günde 50 ya da fazlası",
    legendMerged: "Merge olan PR",
    legendUnread: "Okunmadı",
    coverage: (v) =>
      `${v.total} commit'in en yeni ${v.read} tanesi okundu, ${v.date} tarihine kadar.${v.authenticated ? "" : " Token ile 1.000 taneye kadar okunur."}`,
    dayTitle: (v) => `${v.date}: ${v.count} commit`,
    mergeTitle: (v) => `${v.date}: ${v.count} PR merge oldu`,

    readingTitle: "Okuma",
    copyReading: "Okumayı kopyala",
    copied: "Kopyalandı",
    readingCommits: (v) =>
      v.days === 0
        ? `${v.login} son 12 ayda herkese açık commit atmamış.`
        : `${v.partialFrom ? `${v.partialFrom} tarihine kadar okunan kısımda` : "Son 12 ayda"} ${v.login}, ${v.n(v.weeks)} farklı haftaya yayılan ${v.n(v.days)} günde commit attı.`,
    readingPrs: (v) =>
      v.merged === 0 ? "Başkalarının repolarında henüz merge olmuş PR yok." : `Başkalarının repolarında ${v.m(v.merged)} PR'ı merge edildi.`,
    readingRepos: (v) =>
      v.count === 0
        ? `${v.login} hesabında fork'lar dışında henüz herkese açık repo yok.`
        : `${v.login} hesabının kendi ${v.n(v.count)} reposunda ${v.n(v.stars)} yıldız ve ${v.n(v.forks)} fork var.`,
    readingLanguages: (v) => `En çok kullanılan dil ${v.main}${v.others ? `, ardından ${v.others} geliyor` : ""}.`,
    readingPatterns: (v) =>
      v.found === 0 ? "Aktivitede otomatik görünen bir şey yok." : `Otomatik görünebilecek ${v.n(v.found)} desen var, aşağıda listelendi.`,
    notAScore: "Bu bir puan değil. Her sayı herkese açık GitHub verisinden sayıldı.",
    source: "kaynak",

    languagesTitle: "Her dilde neler yapabilirsin",
    languagesWhy:
      "Her repo, GitHub'ın gösterdiği ana dilinde sayılır: kendi repoların, son 12 ayda commit attığın repolar ve PR'larını merge eden repolar.",
    languagesEmpty: "Henüz okunacak bir dil yok: dili belli herkese açık repo ya da commit bulunmuyor.",
    roles: { main: "Ana dil", regular: "Düzenli", occasional: "Ara sıra" },
    langDays: (v) =>
      v.partialFrom
        ? `${v.partialFrom} tarihine kadar okunan kısımda commit atılan gün: ${v.n(v.days)}.`
        : `Son 12 ayda commit atılan gün: ${v.n(v.days)}.`,
    langRepos: (v) => `Kendi repo: ${v.n(v.repos)}${v.stars ? `, yıldız: ${v.n(v.stars)}` : ""}.`,
    langMerged: (v) => `Başkalarının repolarında merge olan PR: ${v.n(v.merged)}.`,
    canBuild: "Yapabileceklerin",
    nextLabel: "Sıradaki adım",
    next: {
      maintain: (v) => `${v.name} repoların zaten kullanılıyor. En çok yıldız alanına kısa bir rehber yaz ve issue'larına cevap vermeye devam et.`,
      start: (v) => `Baştan sona küçük bir ${v.name} projesi yap ve README ile herkese açık bir repoya koy.`,
      ownTool: (v) => `${v.name} işlerin başkalarının projelerinde merge edildi. Sırada kendine ait küçük bir ${v.name} aracı var.`,
      contribute: (v) => `Zaten kullandığın ${v.name} projelerine düzeltme ve test gönderebilirsin.`,
      review: (v) => `${v.name} işlerini merge eden projelerde başkalarının PR'larını incele. Review'lar da profilinde görünür.`,
      deepen: (v) => `Bir ${v.name} projeni bir adım öteye taşı: testler, etiketli bir sürüm ve bir değişiklik günlüğü.`,
      showcase: (v) => `En iyi ${v.name} reponu seç ve ona ekran görüntülü, kısa örnekli, net bir README yaz.`,
      rhythm: (v) => `${v.name} tarafında düzenli devam et: her hafta birkaç gün, tek bir uzun günden daha çok şey gösterir.`,
    },
    alsoUsed: (v) => `Ayrıca: ${v.list}.`,

    improveTitle: "GitHub'ını daha iyi hale getir",
    improveWhy: "Önce bunlara odaklan, bu sırayla. Her biri profilindeki bir sayıdan çıkıyor.",
    improveNone: "Göze batan bir eksik yok. Aynı ritimde devam et.",
    improve: {
      patterns: {
        title: "Yukarıda işaretlenen aktiviteyi bırak",
        detail: (v) => `Otomatik görünebilecek ${v.n(v.count)} desen var. Tekrarlı ya da toplu aktivite profilin geri kalanına duyulan güveni de düşürür.`,
      },
      profileReadme: {
        title: "Profil README'si ekle",
        detail: (v) => `${v.login} adında herkese açık bir repo açarsan README'si profilinin en üstünde görünür. Henüz yok.`,
      },
      profile: {
        title: "Profilini doldur",
        detail: (v) =>
          v.bio && v.link
            ? "Profilinde bio ve bağlantı yok. Ne yaptığını anlatan tek bir cümle ve sitene ya da bir sosyal hesabına bağlantı, işini tanımayı kolaylaştırır."
            : v.bio
              ? "Profilinde bio yok. Ne yaptığını anlatan tek bir cümle, işini tanımayı kolaylaştırır."
              : "Profilinde bağlantı yok. Siteni ya da bir sosyal hesabını ekle.",
      },
      descriptions: {
        title: "Repolarını açıkla",
        detail: (v) => `${v.n(v.total)} reponun ${v.n(v.count)} tanesinde açıklama yok. Her birine tek satır yazmak repo listeni okunur hale getirir.`,
      },
      license: {
        title: "Lisans ekle",
        detail: (v) => `Kod içeren ${v.n(v.count)} reponun lisansı yok; başkaları kodu kullanıp kullanamayacağını bilemiyor.`,
      },
      topics: {
        title: "Konu etiketi ekle",
        detail: (v) => `${v.n(v.count)} reponun konu etiketi (topic) yok. Etiketler repoları GitHub'ın konu sayfalarına ve aramaya taşır.`,
      },
      stale: {
        title: "Bıraktıklarını arşivle",
        detail: (v) => `${v.n(v.count)} repo bir yıldan uzun süredir değişmedi. Arşivlemek, aktif olanların öne çıkmasını sağlar.`,
      },
      rhythm: {
        title: "Daha çok haftaya yay",
        detail: (v) => `Son 52 haftanın ${v.n(v.weeks)} tanesinde commit var. Her hafta birkaç gün, ara ara yoğun çalışmaktan daha iyi görünür.`,
      },
      firstMerge: {
        title: "İlk PR'ını merge ettir",
        detail: () => "Başkalarının repolarına açtığın PR'lardan henüz merge olan yok. Kullandığın bir projede küçük bir düzeltmeyle başla.",
      },
      reviews: {
        title: "Başkalarının PR'larını incele",
        detail: () => "Başkalarının repolarındaki PR'larda henüz review'un yok. Review'lar profilinde katkı olarak görünür.",
      },
    },

    promptTitle: "Yapay zekâdan fikir al",
    promptWhy:
      "Bu metni kopyalayıp istediğin bir yapay zekâ asistanına yapıştır. Yukarıdaki sayıları taşır; proje fikirleri, profil düzeltmeleri ve dört haftalık bir plan ister. Önce düzenleyebilirsin.",
    copyPrompt: "Metni kopyala",
    prompt: (v) => {
      const lines = [
        `GitHub'ımı daha güçlü hale getirmek için fikir istiyorum. ${v.login} hesabımın herkese açık sayıları şunlar (${v.date} tarihinde okundu):`,
        "",
        `- ${v.since} tarihinden beri GitHub'dayım.`,
        v.days === 0
          ? "- Son 12 ayda herkese açık commit'im yok."
          : `- ${v.partialFrom ? `${v.partialFrom} tarihine kadar okunan kısımda` : "Son 12 ayda"} ${v.n(v.weeks)} farklı haftaya yayılan ${v.n(v.days)} günde commit attım.`,
        `- Başkalarının repolarında merge olan PR: ${v.n(v.merged)}, review: ${v.n(v.reviews)}, açtığım issue: ${v.n(v.issues)}.`,
        `- Kendi herkese açık repo: ${v.n(v.repos)}, yıldız: ${v.n(v.stars)}, fork: ${v.n(v.forks)}.`,
      ];
      if (v.languages.length) {
        lines.push("", "En çok kullandığım diller:");
        for (const l of v.languages) {
          const parts = [
            l.days && `commit atılan gün ${v.n(l.days)}`,
            l.repos && `kendi repo ${v.n(l.repos)}${l.stars ? ` (yıldız ${v.n(l.stars)})` : ""}`,
            l.merged && `merge olan PR ${v.n(l.merged)}`,
          ].filter(Boolean);
          lines.push(`- ${l.name}: ${parts.join(", ")}`);
        }
      }
      if (v.topRepos.length) {
        lines.push("", "En çok yıldız alan repolarım:");
        for (const r of v.topRepos) {
          const about = [r.language, `${v.n(r.stars)} yıldız`].filter(Boolean).join(", ");
          lines.push(`- ${r.name} (${about})${r.description ? `: ${r.description}` : ""}`);
        }
      }
      if (v.improve.length) {
        lines.push("", "Şu an zayıf görünen yanlar:");
        for (const item of v.improve) lines.push(`- ${item}`);
      }
      lines.push(
        "",
        "Senden istediklerim:",
        "1. Dillerime ve seviyeme uyan beş proje fikri. Her biri için: ad, ne işe yaradığı, kimin kullanacağı, neden bana uyduğu ve ilk üç adım.",
        "2. Mevcut repolarımda ve profilimde yapılacak değişiklikler, etkisine göre sıralı.",
        "3. Haftada birkaç saatlik dört haftalık bir plan.",
        "",
        "Tek kişinin yapabileceği gerçekçi öneriler olsun. Profili daha hareketli göstermek için sahte ya da otomatik aktivite önerme.",
      );
      return lines.join("\n");
    },

    prsTitle: "Başkalarının repolarına merge olanlar",
    prsEmpty: "Henüz yok.",
    prsOther: (v) =>
      `Başkalarının repolarında açık PR: ${v.n(v.open)}, merge olmadan kapanan: ${v.n(v.closed)}, review: ${v.n(v.reviews)}, açılan issue: ${v.n(v.issues)}.`,
    prsPartial: (v) => `Liste en yeni ${v.read} merge olmuş PR'ı gösteriyor.`,
    moreRepos: (v) => `${v.n(v.count)} repo daha.`,
    colRepo: "Repo",
    colLanguage: "Dil",
    colMerged: "Merge",
    colLastMerge: "Son merge",
    colStars: "Yıldız",
    colForks: "Fork",

    toolsTitle: "Kendi repoları",
    toolsEmpty: "Henüz kendine ait herkese açık repo yok. Fork'lar burada sayılmıyor.",
    toolsMore: (v) => `Gösterilmeyen ${v.n(v.count)} repo daha var. Fork'lar sayılmıyor.`,
    toolsNoMore: "Fork'lar sayılmıyor.",
    toolsPartial: (v) => `${v.n(v.total)} herkese açık reponun en son güncellenen ${v.n(v.read)} tanesi okundu.`,

    patternsTitle: "Otomatik görünebilecekler",
    patternsWhy: "Tekrarlı ya da toplu aktivite, profile bakan herkese otomatik görünebilir. GitHub'ın kendi kuralları da sahte aktiviteyi yasaklıyor.",
    clear: "Yok",
    foundLabel: "Var",
    patterns: {
      series: {
        title: "Bir gün içinde tekrarlanan aynı commit mesajı",
        found: (v) => `24 saat içinde ${v.n(v.count)} commit aynı mesajı taşıyor: “${v.example}”.`,
      },
      heavy: {
        title: "Bir günde 50 ya da daha fazla commit",
        found: (v) => `${v.n(v.days)} gün; en yoğunu ${v.date}, ${v.n(v.count)} commit.`,
      },
      bulk: {
        title: "Aynı gün açılmış çok sayıda repo",
        found: (v) => `${v.date} tarihinde ${v.n(v.count)} repo açılmış.`,
      },
      empty: {
        title: "Boş repolar",
        found: (v) => `İçeriği olmayan ${v.n(v.count)} repo var.`,
      },
      typo: {
        title: "Typo PR'ları",
        found: (v) => `Başkalarına açılan ${v.n(v.total)} PR'ın ${v.n(v.count)} tanesinin başlığında typo geçiyor.`,
      },
    },

    footerTitle: "Nasıl çalışır",
    footerBody:
      "Builder Check, GitHub API'sinden herkese açık veriyi okur: profil, kendi repoları, başkalarının repolarındaki PR ve issue'lar ve son 12 ayın commit'leri. Bir reponun dili, GitHub'ın o repo için gösterdiği ana dildir.",
    footerNote: "Hiçbir şey kaydedilmez. Sayfa yalnızca api.github.com ile konuşur.",
  },
};

export const GITHUB_RULES = "https://docs.github.com/en/site-policy/acceptable-use-policies/github-acceptable-use-policies";
