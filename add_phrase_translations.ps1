# Script to add Chinese and Greek translations to phrases
$file = "index.html"
$content = Get-Content $file -Raw -Encoding UTF8

# Dictionary of replacements: find pattern -> replacement
$replacements = @{
    'ja:P\("どういたしまして","dou itashimashite"\)\},' = 'ja:P("どういたしまして","dou itashimashite"), zh:P("不客气","bù kèqì"), el:P("Παρακαλώ","parakaló")},'
    'ja:P\("お願いします","onegai shimasu"\)\},' = 'ja:P("お願いします","onegai shimasu"), zh:P("请","qǐng"), el:P("Παρακαλώ","parakaló")},'
    'ja:P\("ごめんなさい","gomen nasai"\)\},' = 'ja:P("ごめんなさい","gomen nasai"), zh:P("对不起","duìbùqǐ"), el:P("Συγγνώμη","syngnómi")},'
    'ja:P\("お元気ですか？","ogenki desu ka"\)\},' = 'ja:P("お元気ですか？","ogenki desu ka"), zh:P("你好吗？","nǐ hǎo ma?"), el:P("Πώς είσαι;","pós eísai;")},'
    'ja:P\("元気です、ありがとう","genki desu, arigatou"\)\},' = 'ja:P("元気です、ありがとう","genki desu, arigatou"), zh:P("我很好，谢谢","wǒ hěn hǎo, xièxie"), el:P("Είμαι καλά, ευχαριστώ","eímai kalá, efcharistó")},'
    'ja:P\("私の名前は…です","watashi no namae wa … desu"\)\},' = 'ja:P("私の名前は…です","watashi no namae wa … desu"), zh:P("我的名字是…","wǒ de míngzi shì …"), el:P("Με λένε…","me léne…")},'
    'ja:P\("わかりません","wakarimasen"\)\},' = 'ja:P("わかりません","wakarimasen"), zh:P("我不明白","wǒ bù míngbái"), el:P("Δεν καταλαβαίνω","den katalavaíno")},'
    'ja:P\("書いてください","kaite kudasai"\)\},' = 'ja:P("書いてください","kaite kudasai"), zh:P("请写下来","qǐng xiě xiàlái"), el:P("Παρακαλώ γράψτε το","parakaló grápsete to")},'
    'ja:P\("それはどういう意味ですか？","sore wa dou iu imi desu ka"\)\},' = 'ja:P("それはどういう意味ですか？","sore wa dou iu imi desu ka"), zh:P("那是什么意思？","nà shì shénme yìsi?"), el:P("Τι σημαίνει αυτό;","ti simaínei aftó;")},'
    'ja:P\("手伝ってくれますか？","tetsudatte kuremasu ka"\)\},' = 'ja:P("手伝ってくれますか？","tetsudatte kuremasu ka"), zh:P("你能帮我吗？","nǐ néng bāng wǒ ma?"), el:P("Μπορείτε να με βοηθήσετε;","boreíte na me voithísete;")},'
    'ja:P\("通訳が必要です","tsuuyaku ga hitsuyou desu"\)\},' = 'ja:P("通訳が必要です","tsuuyaku ga hitsuyou desu"), zh:P("我需要翻译","wǒ xūyào fānyì"), el:P("Χρειάζομαι διερμηνέα","chreiázomai dierminéa")},'
    'ja:P\("今日","kyou"\)\},' = 'ja:P("今日","kyou"), zh:P("今天","jīntiān"), el:P("Σήμερα","símera")},'
    'ja:P\("わかりません","wakarimasen"\)\},' = 'ja:P("わかりません","wakarimasen"), zh:P("我不知道","wǒ bù zhīdào"), el:P("Δεν ξέρω","den xéro")},'
    'ja:P\("お腹が空きました","onaka ga sukimashita"\)\},' = 'ja:P("お腹が空きました","onaka ga sukimashita"), zh:P("我饿了","wǒ è le"), el:P("Πεινάω","peináo")},'
    'ja:P\("喉が渇きました","nodo ga kawakimashita"\)\},' = 'ja:P("喉が渇きました","nodo ga kawakimashita"), zh:P("我渴了","wǒ kě le"), el:P("Διψάω","dipsáo")},'
    'ja:P\("…はどこですか？","… wa doko desu ka"\)\},' = 'ja:P("…はどこですか？","… wa doko desu ka"), zh:P("…在哪里？","… zài nǎlǐ?"), el:P("Πού είναι…;","poú eínai…;")},'
    'ja:P\("迷いました","mayoimashita"\)\},' = 'ja:P("迷いました","mayoimashita"), zh:P("我迷路了","wǒ mílù le"), el:P("Έχω χαθεί","écho chathí")},'
    'ja:P\("どれくらい遠いですか？","dorekurai tooi desu ka"\)\},' = 'ja:P("どれくらい遠いですか？","dorekurai tooi desu ka"), zh:P("有多远？","yǒu duō yuǎn?"), el:P("Πόσο μακριά είναι;","póso makriá eínai;")},'
    'ja:P\("バス停はどこですか？","basutei wa doko desu ka"\)\},' = 'ja:P("バス停はどこですか？","basutei wa doko desu ka"), zh:P("公交站在哪里？","gōngjiāo zhàn zài nǎlǐ?"), el:P("Πού είναι η στάση λεωφορείου;","poú eínai i stási leoforíou;")},'
    'ja:P\("駅はどこですか？","eki wa doko desu ka"\)\},' = 'ja:P("駅はどこですか？","eki wa doko desu ka"), zh:P("火车站在哪里？","huǒchē zhàn zài nǎlǐ?"), el:P("Πού είναι ο σταθμός;","poú eínai o stathmós;")},'
    'ja:P\("一番近い地下鉄の駅はどこですか？","ichiban chikai chikatetsu no eki wa doko desu ka"\)\},' = 'ja:P("一番近い地下鉄の駅はどこですか？","ichiban chikai chikatetsu no eki wa doko desu ka"), zh:P("最近的地铁站在哪里？","zuìjìn de dìtiě zhàn zài nǎlǐ?"), el:P("Πού είναι ο πλησιέστερος σταθμός μετρό;","poú eínai o plisiésteros stathmós metró;")},'
    'ja:P\("空港はどこですか？","kuukou wa doko desu ka"\)\},' = 'ja:P("空港はどこですか？","kuukou wa doko desu ka"), zh:P("机场在哪里？","jīchǎng zài nǎlǐ?"), el:P("Πού είναι το αεροδρόμιο;","poú eínai to aerodrómio;")},'
    'ja:P\("\[場所\]までの切符を1枚ください","\[basho\] made no kippu o ichimai kudasai"\)\},' = 'ja:P("[場所]までの切符を1枚ください","[basho] made no kippu o ichimai kudasai"), zh:P("请给我一张到[地方]的票","qǐng gěi wǒ yī zhāng dào [dìfāng] de piào"), el:P("Ένα εισιτήριο για [τόπος], παρακαλώ","éna eisitírio gia [tópos], parakaló")},'
    'ja:P\("ここで止めてください","koko de tomete kudasai"\)\},' = 'ja:P("ここで止めてください","koko de tomete kudasai"), zh:P("请在这里停","qǐng zài zhèlǐ tíng"), el:P("Σταματήστε εδώ, παρακαλώ","stamatíste edó, parakaló")},'
    'ja:P\("ホテルはどこですか？","hoteru wa doko desu ka"\)\},' = 'ja:P("ホテルはどこですか？","hoteru wa doko desu ka"), zh:P("酒店在哪里？","jiǔdiàn zài nǎlǐ?"), el:P("Πού είναι το ξενοδοχείο;","poú eínai to xenodocheío;")},'
}

Write-Host "Processing $file..."
$count = 0
foreach($key in $replacements.Keys) {
    if($content -match $key) {
        $content = $content -replace $key, $replacements[$key]
        $count++
        Write-Host "Replaced pattern $count"
    }
}

Set-Content $file -Value $content -Encoding UTF8 -NoNewline
Write-Host "Done! Made $count replacements."
