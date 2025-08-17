@echo off
setlocal enabledelayedexpansion

:: Weekly titles: English Translation + Hebrew Transliteration|Hebrew
set titles[1]=In the Beginning B’reisheet|בראשית
set titles[2]=Noah Noach|נח
set titles[3]=Go Forth Lech Lecha|לך לך
set titles[4]=He Appeared Vayera|וירא
set titles[5]=Life of Sarah Chayei Sarah|חיי שרה
set titles[6]=Generations Toldot|תולדות
set titles[7]=He Went Out Vayetzei|ויצא
set titles[8]=He Sent Vayishlach|וישלח
set titles[9]=He Settled Vayeshev|וישב
set titles[10]=At the End Miketz|מקץ
set titles[11]=He Drew Near Vayigash|ויגש
set titles[12]=And He Lived Vayechi|ויחי
set titles[13]=Names Shemot|שמות
set titles[14]=I Appeared Vaera|וארא
set titles[15]=Come Bo|בא
set titles[16]=When He Sent Beshalach|בשלח
set titles[17]=Jethro Yitro|יתרו
set titles[18]=Judgments Mishpatim|משפטים
set titles[19]=Contribution Terumah|תרומה
set titles[20]=You Shall Command Tetzaveh|תצוה
set titles[21]=When You Lift Ki Tisa|כי תשא
set titles[22]=He Assembled Vayakhel|ויקהל
set titles[23]=Accounts Pekudei|פקודי
set titles[24]=And He Called Vayikra|ויקרא
set titles[25]=Command Tzav|צו
set titles[26]=Eighth Shemini|שמיני
set titles[27]=She Will Conceive Tazria|תזריע
set titles[28]=Leper Metzora|מצורע
set titles[29]=After the Death Acharei Mot|אחרי מות
set titles[30]=Holy Ones Kedoshim|קדושים
set titles[31]=Say Emor|אמר
set titles[32]=On the Mount Behar|בהר
set titles[33]=By My Decrees Bechukotai|בחוקותי
set titles[34]=In the Wilderness Bamidbar|במדבר
set titles[35]=Lift Up Nasso|נשא
set titles[36]=When You Light Behaalotcha|בהעלתך
set titles[37]=Send Shlach|שלח
set titles[38]=Korah Korach|קרח
set titles[39]=Statute Chukat|חקת
set titles[40]=Balak Balak|בלק
set titles[41]=Phinehas Pinchas|פינחס
set titles[42]=Tribes Matot|מטות
set titles[43]=Journeys Masei|מסעי
set titles[44]=Words Devarim|דברים
set titles[45]=I Pleaded Vaetchanan|ואתחנן
set titles[46]=Because Eikev|עקב
set titles[47]=See Re’eh|ראה
set titles[48]=Judges Shoftim|שופטים
set titles[49]=When You Go Out Ki Teitzei|כי תצא
set titles[50]=When You Come In Ki Tavo|כי תבוא
set titles[51]=Standing Nitzavim|נצבים
set titles[52]=And He Went Vayelech|וילך

:: Create JSON files for Weeks 1–52
for /L %%i in (1,1,52) do (
    for /f "tokens=1,2 delims=|" %%a in ("!titles[%%i]!") do (
        set en=%%a
        set he=%%b
        echo { } > "Week %%i- !en! (!he!).json"
        echo Created: Week %%i- !en! (!he!).json
    )
)

echo ✅ All weekly JSON files created successfully!
pause
