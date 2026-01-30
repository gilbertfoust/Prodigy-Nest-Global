# Script to add Chinese (zh) and Greek (el) translations to phrases, numbers, and verbs
$file = "index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Chinese and Greek translations for common phrases
$translations = @{
    "Excuse me" = @{zh="打扰一下"; el="Συγγνώμη"}
    "I'm sorry" = @{zh="对不起"; el="Συγγνώμη"}
    "Good morning" = @{zh="早上好"; el="Καλημέρα"}
    "Good afternoon" = @{zh="下午好"; el="Καλησπέρα"}
    "Good evening" = @{zh="晚上好"; el="Καλησπέρα"}
    "Good night" = @{zh="晚安"; el="Καληνύχτα"}
    "Goodbye" = @{zh="再见"; el="Αντίο"}
    "See you later" = @{zh="回头见"; el="Τα λέμε αργότερα"}
    "How are you?" = @{zh="你好吗？"; el="Πώς είσαι;"}
    "I'm fine, thank you" = @{zh="我很好，谢谢"; el="Είμαι καλά, ευχαριστώ"}
    "What is your name?" = @{zh="你叫什么名字？"; el="Πώς σε λένε;"}
    "My name is…" = @{zh="我的名字是…"; el="Με λένε…"}
    "Do you speak English?" = @{zh="你会说英语吗？"; el="Μιλάτε αγγλικά;"}
    "Do you speak Spanish?" = @{zh="你会说西班牙语吗？"; el="Μιλάτε ισπανικά;"}
    "I don't understand" = @{zh="我不明白"; el="Δεν καταλαβαίνω"}
    "Could you repeat that?" = @{zh="你能重复一下吗？"; el="Μπορείτε να το επαναλάβετε;"}
    "Could you speak more slowly?" = @{zh="你能说慢一点吗？"; el="Μπορείτε να μιλάτε πιο αργά;"}
    "Please write it down" = @{zh="请写下来"; el="Παρακαλώ γράψτε το"}
    "How do you say [word] in [language]?" = @{zh="[语言]里[单词]怎么说？"; el="Πώς λέτε [λέξη] στα [γλώσσα];"}
    "What does that mean?" = @{zh="那是什么意思？"; el="Τι σημαίνει αυτό;"}
    "Can you help me?" = @{zh="你能帮我吗？"; el="Μπορείτε να με βοηθήσετε;"}
    "I need an interpreter" = @{zh="我需要翻译"; el="Χρειάζομαι διερμηνέα"}
    "Can you show me?" = @{zh="你能给我看看吗？"; el="Μπορείτε να μου δείξετε;"}
    "What time is it?" = @{zh="几点了？"; el="Τι ώρα είναι;"}
    "Today" = @{zh="今天"; el="Σήμερα"}
    "Tomorrow" = @{zh="明天"; el="Αύριο"}
    "Now" = @{zh="现在"; el="Τώρα"}
    "Later" = @{zh="稍后"; el="Αργότερα"}
    "I don't know" = @{zh="我不知道"; el="Δεν ξέρω"}
    "Please wait" = @{zh="请稍等"; el="Παρακαλώ περιμένετε"}
    "I'm hungry" = @{zh="我饿了"; el="Πεινάω"}
    "I'm thirsty" = @{zh="我渴了"; el="Διψάω"}
    "Where is…?" = @{zh="…在哪里？"; el="Πού είναι…;"}
    "I'm lost" = @{zh="我迷路了"; el="Έχω χαθεί"}
    "Left" = @{zh="左"; el="Αριστερά"}
    "Right" = @{zh="右"; el="Δεξιά"}
    "Straight ahead" = @{zh="直走"; el="Ευθεία"}
    "How far is it?" = @{zh="有多远？"; el="Πόσο μακριά είναι;"}
    "How long will it take?" = @{zh="需要多长时间？"; el="Πόσο θα πάρει;"}
    "Where is the bus stop?" = @{zh="公交站在哪里？"; el="Πού είναι η στάση λεωφορείου;"}
    "Where is the train station?" = @{zh="火车站在哪里？"; el="Πού είναι ο σταθμός;"}
    "Where is the nearest metro station?" = @{zh="最近的地铁站在哪里？"; el="Πού είναι ο πλησιέστερος σταθμός μετρό;"}
    "Where is the airport?" = @{zh="机场在哪里？"; el="Πού είναι το αεροδρόμιο;"}
    "Where can I buy tickets?" = @{zh="在哪里买票？"; el="Πού μπορώ να αγοράσω εισιτήρια;"}
    "One ticket to [place], please" = @{zh="请给我一张到[地方]的票"; el="Ένα εισιτήριο για [τόπος], παρακαλώ"}
    "What time does it leave?" = @{zh="什么时候出发？"; el="Τι ώρα φεύγει;"}
    "What time does it arrive?" = @{zh="什么时候到达？"; el="Τι ώρα φτάνει;"}
    "Which platform?" = @{zh="哪个站台？"; el="Ποια πλατφόρμα;"}
    "Can you call a taxi for me?" = @{zh="你能帮我叫辆出租车吗？"; el="Μπορείτε να καλέσετε ταξί για μένα;"}
    "Stop here, please" = @{zh="请在这里停"; el="Σταματήστε εδώ, παρακαλώ"}
    "Where is the hotel?" = @{zh="酒店在哪里？"; el="Πού είναι το ξενοδοχείο;"}
    "I have a reservation" = @{zh="我有预订"; el="Έχω κράτηση"}
    "I'd like a room" = @{zh="我想要一个房间"; el="Θα ήθελα ένα δωμάτιο"}
    "How much per night?" = @{zh="每晚多少钱？"; el="Πόσο ανά βράδυ;"}
    "What time is check-in?" = @{zh="什么时候入住？"; el="Τι ώρα είναι το check-in;"}
    "What time is check-out?" = @{zh="什么时候退房？"; el="Τι ώρα είναι το check-out;"}
    "Where is the elevator?" = @{zh="电梯在哪里？"; el="Πού είναι το ασανσέρ;"}
    "The key/card, please" = @{zh="请给我钥匙/卡"; el="Το κλειδί/κάρτα, παρακαλώ"}
    "Can I have the menu, please?" = @{zh="请给我菜单"; el="Μπορώ να έχω το μενού, παρακαλώ;"}
    "Water, please" = @{zh="请给我水"; el="Νερό, παρακαλώ"}
    "Coffee, please" = @{zh="请给我咖啡"; el="Καφέ, παρακαλώ"}
    "Tea, please" = @{zh="请给我茶"; el="Τσάι, παρακαλώ"}
    "I'm vegetarian" = @{zh="我是素食主义者"; el="Είμαι χορτοφάγος"}
    "I'm vegan" = @{zh="我是纯素食主义者"; el="Είμαι βίγκαν"}
    "I'm allergic to [allergen]" = @{zh="我对[过敏原]过敏"; el="Έχω αλλεργία στο [αλλεργιογόνο]"}
    "It's delicious" = @{zh="很好吃"; el="Είναι νόστιμο"}
    "The bill/check, please" = @{zh="请结账"; el="Το λογαριασμό, παρακαλώ"}
    "Can I pay by card?" = @{zh="可以用卡支付吗？"; el="Μπορώ να πληρώσω με κάρτα;"}
    "Can I have a receipt?" = @{zh="可以给我收据吗？"; el="Μπορώ να έχω απόδειξη;"}
    "How much does it cost?" = @{zh="多少钱？"; el="Πόσο κοστίζει;"}
    "Too expensive" = @{zh="太贵了"; el="Πολύ ακριβό"}
    "Is there a discount?" = @{zh="有折扣吗？"; el="Υπάρχει έκπτωση;"}
    "I would like to buy this" = @{zh="我想买这个"; el="Θα ήθελα να αγοράσω αυτό"}
    "I'm just looking" = @{zh="我只是看看"; el="Απλά κοιτάζω"}
    "Do you have this in a different size?" = @{zh="有其他尺寸吗？"; el="Το έχετε σε άλλο μέγεθος;"}
    "Can I try this on?" = @{zh="我可以试穿吗？"; el="Μπορώ να το δοκιμάσω;"}
    "Is there Wi-Fi?" = @{zh="有Wi-Fi吗？"; el="Υπάρχει Wi-Fi;"}
    "What is the Wi-Fi password?" = @{zh="Wi-Fi密码是什么？"; el="Ποιος είναι ο κωδικός Wi-Fi;"}
    "Can I charge my phone here?" = @{zh="我可以在这里充电吗？"; el="Μπορώ να φορτίσω το τηλέφωνό μου εδώ;"}
    "Where can I buy a SIM card?" = @{zh="在哪里可以买SIM卡？"; el="Πού μπορώ να αγοράσω κάρτα SIM;"}
    "I don't feel well" = @{zh="我感觉不舒服"; el="Δεν αισθάνομαι καλά"}
    "I need medicine" = @{zh="我需要药"; el="Χρειάζομαι φάρμακα"}
    "Is there a pharmacy nearby?" = @{zh="附近有药店吗？"; el="Υπάρχει φαρμακείο κοντά;"}
    "Where is the hospital?" = @{zh="医院在哪里？"; el="Πού είναι το νοσοκομείο;"}
    "I need help" = @{zh="我需要帮助"; el="Χρειάζομαι βοήθεια"}
    "Call the police, please" = @{zh="请报警"; el="Καλέστε την αστυνομία, παρακαλώ"}
    "Call a doctor, please" = @{zh="请叫医生"; el="Καλέστε γιατρό, παρακαλώ"}
    "I lost my passport" = @{zh="我丢了护照"; el="Έχασα το διαβατήριό μου"}
    "Stop!" = @{zh="停下！"; el="Σταμάτα!"}
    "Fire!" = @{zh="着火了！"; el="Φωτιά!"}
    "Emergency!" = @{zh="紧急情况！"; el="Επείγον!"}
    "Do you have a map?" = @{zh="你有地图吗？"; el="Έχετε χάρτη;"}
    "Can I get a map?" = @{zh="我可以要一张地图吗？"; el="Μπορώ να πάρω χάρτη;"}
    "What's the entrance fee?" = @{zh="门票多少钱？"; el="Πόσο είναι το εισιτήριο;"}
    "What time does it start?" = @{zh="什么时候开始？"; el="Τι ώρα αρχίζει;"}
    "Where can I find information?" = @{zh="在哪里可以找到信息？"; el="Πού μπορώ να βρω πληροφορίες;"}
    "Can I take a photo?" = @{zh="我可以拍照吗？"; el="Μπορώ να τραβήξω φωτογραφία;"}
    "Could you take a picture of us?" = @{zh="你能帮我们拍张照吗？"; el="Μπορείτε να μας βγάλετε φωτογραφία;"}
}

# Numbers translations
$numberTranslations = @{
    0 = @{zh="零"; el="μηδέν"}
    1 = @{zh="一"; el="ένα"}
    2 = @{zh="二"; el="δύο"}
    3 = @{zh="三"; el="τρία"}
    4 = @{zh="四"; el="τέσσερα"}
    5 = @{zh="五"; el="πέντε"}
    6 = @{zh="六"; el="έξι"}
    7 = @{zh="七"; el="επτά"}
    8 = @{zh="八"; el="οκτώ"}
    9 = @{zh="九"; el="εννέα"}
    10 = @{zh="十"; el="δέκα"}
    20 = @{zh="二十"; el="είκοσι"}
    30 = @{zh="三十"; el="τριάντα"}
    40 = @{zh="四十"; el="σαράντα"}
    50 = @{zh="五十"; el="πενήντα"}
    60 = @{zh="六十"; el="εξήντα"}
    70 = @{zh="七十"; el="εβδομήντα"}
    80 = @{zh="八十"; el="ογδόντα"}
    90 = @{zh="九十"; el="ενενήντα"}
    100 = @{zh="一百"; el="εκατό"}
}

Write-Host "Translation dictionaries created. Ready to process file."
