"""デモSKU（src/data/demoSkus.json）を作る（L-40、開発時のみ）。

ゆうの既存データ資産（Medicine Recommend System の統合マスターと画像URL）から、下の SKUS に挙げた品だけを取り出し、
分量・内容量・JAN は公開情報で調べた値（research.json）で補う。カタログ全件・CSV はリポに入れない。
効能・効果と用法・用量の文面は取り出さない（rules §4-4。画面では PMDA へリンクアウト）。

使い方:
  python3 -I scripts/demo/build_demo_skus.py <otc_medicines_integrated.csv> <r2_medicine_image_urls.json> \
      src/data/demoSkus.json <research.json> [<research.json> ...]
"""

import csv
import json
import sys
import unicodedata

# (id, 既存データの id, 薬の種類, 通知の薬効群 ID, 効能に含まれる薬効群)
SKUS = [
    ("shin-lulu-a-s", "med_05447", "cold", "kaze_1", ["かぜ薬"]),
    ("lulu-attack-ex", "med_05597", "cold", "kaze_1", ["かぜ薬"]),
    ("benza-block-l", "med_05696", "cold", "kaze_1", ["かぜ薬"]),
    ("shin-contac-kaze", "med_05507", "cold", "kaze_1", ["かぜ薬"]),
    ("shin-estac-granule", "med_05529", "cold", "kaze_1", ["かぜ薬"]),
    ("estac-ibu-fine-ex", "med_06446", "cold", "kaze_1", ["かぜ薬"]),
    ("loxonin-s", "med_00551", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("eve-a", "med_00190", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("bufferin-a", "med_00318", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("tylenol-a", "med_00592", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("naron-ace", "med_00266", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("shin-sedes", "med_00244", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("allegra-fx", "med_05201", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("alesion-20", "med_05105", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("pabron-bien-ex", "med_05013", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("stona-rhini-s", "med_05116", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("shin-bron-ace", "med_05458", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("benza-block-cough", "med_05687", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("drewell", "med_04904", "sleep", "suimin_kaizen", ["催眠鎮静薬"]),
    # 追加21品（L-20261103-03）
    ("pylon-pl-granule", "med_05904", "cold", "kaze_1", ["かぜ薬"]),
    ("lulu-attack-nx", "med_05592", "cold", "kaze_1", ["かぜ薬"]),
    ("shin-lulu-a-gold-s", "med_05448", "cold", "kaze_1", ["かぜ薬"]),
    ("benza-block-s", "med_05690", "cold", "kaze_1", ["かぜ薬"]),
    ("loxonin-s-premium", "med_00552", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("eve-quick-dx", "med_00194", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("bufferin-premium", "med_00320", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("calonal-a", "med_00588", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("excedrin-a", "med_00316", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("stona-rhini-z-gel", "med_05119", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("algard-gold-z", "med_05026", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("colgen-film-alpha", "med_05111", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("jikinin-bien-ag", "med_05004", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("medicon-pro", "med_05638", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("mucodyne-pro500", "med_05648", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("pabron-s-cough", "med_05881", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("ss-bron-ace-tab", "med_05538", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("stona-kyotan", "med_06105", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("askuron", "med_07286", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("drewell-ex", "med_04905", "sleep", "suimin_kaizen", ["催眠鎮静薬"]),
    ("dreamin-z", "med_04906", "sleep", "suimin_kaizen", ["催眠鎮静薬"]),
    # 追加97品（L-20261103-08）。id は既存データの id から
    ("med-05883", "med_05883", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05697", "med_05697", "cold", "kaze_1", ["かぜ薬"]),
    ("med-06448", "med_06448", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05907", "med_05907", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05491", "med_05491", "cold", "kaze_1", ["かぜ薬"]),
    ("med-00553", "med_00553", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00193", "med_00193", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00274", "med_00274", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00243", "med_00243", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00233", "med_00233", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00177", "med_00177", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-06455", "med_06455", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("med-05476", "med_05476", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("med-05751", "med_05751", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("med-06018", "med_06018", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("med-05114", "med_05114", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("med-05107", "med_05107", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("med-05149", "med_05149", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("med-00522", "med_00522", "motion", "chinun", ["鎮暈薬"]),
    ("med-00598", "med_00598", "motion", "chinun", ["鎮暈薬"]),
    ("med-00616", "med_00616", "motion", "chinun", ["鎮暈薬"]),
    ("med-00635", "med_00635", "motion", "chinun", ["鎮暈薬"]),
    ("med-05216", "med_05216", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05231", "med_05231", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05235", "med_05235", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05220", "med_05220", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05277", "med_05277", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05072", "med_05072", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-00083", "med_00083", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00086", "med_00086", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00096", "med_00096", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00097", "med_00097", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00054", "med_00054", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00102", "med_00102", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00104", "med_00104", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00138", "med_00138", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00080", "med_00080", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00140", "med_00140", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00147", "med_00147", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-04107", "med_04107", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-04104", "med_04104", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-04160", "med_04160", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-04221", "med_04221", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00145", "med_00145", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00144", "med_00144", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-06556", "med_06556", "eye", "ganka", ["眼科用薬"]),
    ("med-06750", "med_06750", "eye", "ganka", ["眼科用薬"]),
    ("med-06747", "med_06747", "eye", "ganka", ["眼科用薬"]),
    ("med-06748", "med_06748", "eye", "ganka", ["眼科用薬"]),
    ("med-06740", "med_06740", "eye", "ganka", ["眼科用薬"]),
    ("med-06746", "med_06746", "eye", "ganka", ["眼科用薬"]),
    ("med-06844", "med_06844", "eye", "ganka", ["眼科用薬"]),
    ("med-06847", "med_06847", "eye", "ganka", ["眼科用薬"]),
    ("med-06641", "med_06641", "eye", "ganka", ["眼科用薬"]),
    ("med-06651", "med_06651", "eye", "ganka", ["眼科用薬"]),
    ("med-06650", "med_06650", "eye", "ganka", ["眼科用薬"]),
    ("med-06660", "med_06660", "eye", "ganka", ["眼科用薬"]),
    ("med-06679", "med_06679", "eye", "ganka", ["眼科用薬"]),
    ("med-06611", "med_06611", "eye", "ganka", ["眼科用薬"]),
    ("med-07285", "med_07285", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-07092", "med_07092", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-01123", "med_01123", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-01148", "med_01148", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04595", "med_04595", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04323", "med_04323", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04318", "med_04318", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04325", "med_04325", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00762", "med_00762", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00717", "med_00717", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00781", "med_00781", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00169", "med_00169", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00708", "med_00708", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-06002", "med_06002", "kampo", "kampo", ["漢方製剤"]),
    ("med-05996", "med_05996", "kampo", "kampo", ["漢方製剤"]),
    ("med-05995", "med_05995", "kampo", "kampo", ["漢方製剤"]),
    ("med-05349", "med_05349", "kampo", "kampo", ["漢方製剤"]),
    ("med-06003", "med_06003", "kampo", "kampo", ["漢方製剤"]),
    ("med-00014", "med_00014", "kampo", "kampo", ["漢方製剤"]),
    ("med-07019", "med_07019", "kampo", "kampo", ["漢方製剤"]),
    ("med-01521", "med_01521", "topical", "gaihi", ["外皮用薬"]),
    ("med-01369", "med_01369", "topical", "gaihi", ["外皮用薬"]),
    ("med-01530", "med_01530", "topical", "gaihi", ["外皮用薬"]),
    ("med-01348", "med_01348", "topical", "gaihi", ["外皮用薬"]),
    ("med-01624", "med_01624", "topical", "gaihi", ["外皮用薬"]),
    ("med-03162", "med_03162", "topical", "gaihi", ["外皮用薬"]),
    ("med-01748", "med_01748", "topical", "gaihi", ["外皮用薬"]),
    ("med-01750", "med_01750", "topical", "gaihi", ["外皮用薬"]),
    ("med-02048", "med_02048", "topical", "gaihi", ["外皮用薬"]),
    ("med-02825", "med_02825", "topical", "gaihi", ["外皮用薬"]),
    ("med-01997", "med_01997", "topical", "gaihi", ["外皮用薬"]),
    ("med-01942", "med_01942", "topical", "gaihi", ["外皮用薬"]),
    ("med-03539", "med_03539", "topical", "gaihi", ["外皮用薬"]),
    ("med-03160", "med_03160", "topical", "gaihi", ["外皮用薬"]),
    ("med-01638", "med_01638", "topical", "gaihi", ["外皮用薬"]),
    ("med-01633", "med_01633", "topical", "gaihi", ["外皮用薬"]),
    ("med-01540", "med_01540", "topical", "gaihi", ["外皮用薬"]),
    ("med-03046", "med_03046", "topical", "gaihi", ["外皮用薬"]),
    # 類似名・同シリーズ品（L-20261103-24）。製造終了・現行品か未確認・JAN なしの11品は入れない
    ("med-05882", "med_05882", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05450", "med_05450", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05591", "med_05591", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05596", "med_05596", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05594", "med_05594", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05599", "med_05599", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05598", "med_05598", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05906", "med_05906", "cold", "kaze_1", ["かぜ薬"]),
    ("med-05905", "med_05905", "cold", "kaze_1", ["かぜ薬"]),
    ("med-06453", "med_06453", "cold", "kaze_1", ["かぜ薬"]),
    ("med-06220", "med_06220", "cold", "kaze_1", ["かぜ薬"]),
    ("med-06118", "med_06118", "cold", "kaze_1", ["かぜ薬"]),
    ("med-00323", "med_00323", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00319", "med_00319", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00191", "med_00191", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00196", "med_00196", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00571", "med_00571", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00228", "med_00228", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00179", "med_00179", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00185", "med_00185", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-00246", "med_00246", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("med-05202", "med_05202", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("med-05011", "med_05011", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("med-05639", "med_05639", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("med-06128", "med_06128", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    # 定番品の追加42品（L-20261103-32）。ロートゴールド40 は後継の Vロートゴールド40（同成分）の行で入れる
    ("med-06902", "med_06902", "eye", "ganka", ["眼科用薬"]),
    ("med-06956", "med_06956", "eye", "ganka", ["眼科用薬"]),
    ("med-06751", "med_06751", "eye", "ganka", ["眼科用薬"]),
    ("med-06741", "med_06741", "eye", "ganka", ["眼科用薬"]),
    ("med-06919", "med_06919", "eye", "ganka", ["眼科用薬"]),
    ("med-06875", "med_06875", "eye", "ganka", ["眼科用薬"]),
    ("med-07231", "med_07231", "eye", "ganka", ["眼科用薬"]),
    ("med-07257", "med_07257", "eye", "ganka", ["眼科用薬"]),
    ("med-07234", "med_07234", "eye", "ganka", ["眼科用薬"]),
    ("med-06879", "med_06879", "eye", "ganka", ["眼科用薬"]),
    ("med-06881", "med_06881", "eye", "ganka", ["眼科用薬"]),
    ("med-06625", "med_06625", "eye", "ganka", ["眼科用薬"]),
    ("med-06626", "med_06626", "eye", "ganka", ["眼科用薬"]),
    ("med-06776", "med_06776", "eye", "ganka", ["眼科用薬"]),
    ("med-06777", "med_06777", "eye", "ganka", ["眼科用薬"]),
    ("med-00118", "med_00118", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00122", "med_00122", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00146", "med_00146", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00021", "med_00021", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-01151", "med_01151", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-07109", "med_07109", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04159", "med_04159", "kampo", "kampo", ["漢方製剤"]),
    ("med-04210", "med_04210", "kampo", "kampo", ["漢方製剤"]),
    ("med-03986", "med_03986", "kampo", "kampo", ["漢方製剤"]),
    ("med-00998", "med_00998", "kampo", "kampo", ["漢方製剤"]),
    ("med-01061", "med_01061", "kampo", "kampo", ["漢方製剤"]),
    ("med-03936", "med_03936", "kampo", "kampo", ["漢方製剤"]),
    ("med-04810", "med_04810", "kampo", "kampo", ["漢方製剤"]),
    ("med-04058", "med_04058", "kampo", "kampo", ["漢方製剤"]),
    ("med-04276", "med_04276", "kampo", "kampo", ["漢方製剤"]),
    ("med-04780", "med_04780", "kampo", "kampo", ["漢方製剤"]),
    ("med-01559", "med_01559", "topical", "gaihi", ["外皮用薬"]),
    ("med-04341", "med_04341", "topical", "gaihi", ["外皮用薬"]),
    ("med-01755", "med_01755", "topical", "gaihi", ["外皮用薬"]),
    ("med-01754", "med_01754", "topical", "gaihi", ["外皮用薬"]),
    ("med-01982", "med_01982", "topical", "gaihi", ["外皮用薬"]),
    ("med-02715", "med_02715", "topical", "gaihi", ["外皮用薬"]),
    ("med-02713", "med_02713", "topical", "gaihi", ["外皮用薬"]),
    ("med-03169", "med_03169", "topical", "gaihi", ["外皮用薬"]),
    ("med-03167", "med_03167", "topical", "gaihi", ["外皮用薬"]),
    ("med-03058", "med_03058", "topical", "gaihi", ["外皮用薬"]),
    ("med-01812", "med_01812", "topical", "gaihi", ["外皮用薬"]),
    # 220品超へ追加32品（L-20261103-33）。乗り物酔い薬・点鼻薬・口内炎・胃腸薬・かぜの漢方薬・ビタミン剤
    ("med-00652", "med_00652", "motion", "chinun", ["鎮暈薬"]),
    ("med-00650", "med_00650", "motion", "chinun", ["鎮暈薬"]),
    ("med-00651", "med_00651", "motion", "chinun", ["鎮暈薬"]),
    ("med-00619", "med_00619", "motion", "chinun", ["鎮暈薬"]),
    ("med-00617", "med_00617", "motion", "chinun", ["鎮暈薬"]),
    ("med-00614", "med_00614", "motion", "chinun", ["鎮暈薬"]),
    ("med-00630", "med_00630", "motion", "chinun", ["鎮暈薬"]),
    ("med-05221", "med_05221", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05222", "med_05222", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05223", "med_05223", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05086", "med_05086", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05276", "med_05276", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-05239", "med_05239", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-01536", "med_01536", "topical", "gaihi", ["外皮用薬"]),
    ("med-01555", "med_01555", "topical", "gaihi", ["外皮用薬"]),
    ("med-02933", "med_02933", "topical", "gaihi", ["外皮用薬"]),
    ("med-02953", "med_02953", "topical", "gaihi", ["外皮用薬"]),
    ("med-03011", "med_03011", "topical", "gaihi", ["外皮用薬"]),
    ("med-01541", "med_01541", "topical", "gaihi", ["外皮用薬"]),
    ("med-00152", "med_00152", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00137", "med_00137", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00142", "med_00142", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-00133", "med_00133", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-05992", "med_05992", "kampo", "kampo", ["漢方製剤"]),
    ("med-05993", "med_05993", "kampo", "kampo", ["漢方製剤"]),
    ("med-05994", "med_05994", "kampo", "kampo", ["漢方製剤"]),
    ("med-06004", "med_06004", "kampo", "kampo", ["漢方製剤"]),
    ("med-06005", "med_06005", "kampo", "kampo", ["漢方製剤"]),
    ("med-06006", "med_06006", "kampo", "kampo", ["漢方製剤"]),
    ("med-07091", "med_07091", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-04596", "med_04596", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00764", "med_00764", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    # 突き合わせ調査で条件がそろった7品（L-20261103-34）
    ("med-01312", "med_01312", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00723", "med_00723", "vitamin", "vitamin", ["ビタミン主薬製剤"]),
    ("med-00520", "med_00520", "motion", "chinun", ["鎮暈薬"]),
    ("med-00660", "med_00660", "motion", "chinun", ["鎮暈薬"]),
    ("med-05074", "med_05074", "nasal", "tenbi", ["鼻炎用点鼻薬"]),
    ("med-00085", "med_00085", "stomach", "ichoyaku", ["胃腸薬"]),
    ("med-05338", "med_05338", "kampo", "kampo", ["漢方製剤"]),
]

# 生薬を主たる有効成分とする製剤（指定濫用防止の対象外の判定、告示第32号）。漢方薬の種類と、胃腸薬・便秘薬の漢方処方（L-20261103-08）
CRUDE_DRUG_MAIN_KINDS = {"kampo"}
CRUDE_DRUG_MAIN = {"太田漢方胃腸薬II", "大正漢方胃腸薬", "タケダ漢方便秘薬", "大正漢方便秘薬", "新コッコアポA錠", "ロート防風通聖散錠満量a"}

# 通知の記載条件「抗ヒスタミン剤を含有する製剤」に当てるための成分群
ANTIHISTAMINES = [
    "クロルフェニラミン", "クレマスチン", "ジフェンヒドラミン", "カルビノキサミン",
    "フェキソフェナジン", "エピナスチン", "メキタジン", "ケトチフェン",
]
# 通知の記載条件「副交感神経遮断剤を含有する製剤」に当てるための成分（手引きの抗コリン成分と、ベラドンナアルカロイドを含む生薬、L-20261103-28）
PARASYMPATHOLYTICS = ["ベラドンナ総アルカロイド", "ヨウ化イソプロパミド", "ダツラエキス", "ロートエキス"]
# 眠気の注意につながる成分（抗ヒスタミン剤の一部・鎮静成分・コデイン類）。成分名の照合だけ
DROWSY = [
    "クロルフェニラミン", "クレマスチン", "ジフェンヒドラミン", "カルビノキサミン", "エピナスチン",
    "メキタジン", "ケトチフェン", "ブロモバレリル尿素", "アリルイソプロピルアセチル尿素", "コデイン",
]

# パッケージの外の文言・ロゴを切り抜いた新しい画像（ゆうが R2 に配置、L-20261103-01）。既存の対応表より優先する
IMAGE_OVERRIDE = {
    "バファリンA": "https://images.yutok.dev/otc/bufferin-a.webp?v=3ac703b8",
    "新ブロン液エース": "https://images.yutok.dev/otc/shin-bron-ace.webp?v=682d0fcb",
    # 品名に記号（「」・<>）があり簡易の対応表から引けない品。既存データの詳しい対応表（r2_medicine_image_mapping_detailed.json）の URL（L-20261103-34）
    "アネロン「ニスキャップ」": "https://images.yutok.dev/otc/%E3%82%A2%E3%83%8D%E3%83%AD%E3%83%B3%E3%83%8B%E3%82%B9%E3%82%AD%E3%83%A3%E3%83%83%E3%83%97.webp?v=4070c345",
    "センパア・QT": "https://images.yutok.dev/otc/%E3%82%BB%E3%83%B3%E3%83%91%E3%82%A2QT.webp?v=771ace9d",
    "ナザールαAR0.1%<季節性アレルギー専用>": "https://images.yutok.dev/otc/%E3%83%8A%E3%82%B6%E3%83%BC%E3%83%AB%CE%B1AR01%E5%AD%A3%E7%AF%80%E6%80%A7%E3%82%A2%E3%83%AC%E3%83%AB%E3%82%AE%E3%83%BC%E5%B0%82%E7%94%A8.webp?v=01b70fee",
    "太田胃散A<錠剤>": "https://images.yutok.dev/otc/%E5%A4%AA%E7%94%B0%E8%83%83%E6%95%A3A%E9%8C%A0%E5%89%A4.webp?v=8f40c5c0",
    "「クラシエ」漢方葛根湯加川きゅう辛夷エキス顆粒": "https://images.yutok.dev/otc/%E3%82%AF%E3%83%A9%E3%82%B7%E3%82%A8%E6%BC%A2%E6%96%B9%E8%91%9B%E6%A0%B9%E6%B9%AF%E5%8A%A0%E5%B7%9D%E3%81%8D%E3%82%85%E3%81%86%E8%BE%9B%E5%A4%B7%E3%82%A8%E3%82%AD%E3%82%B9%E9%A1%86%E7%B2%92.webp?v=1d1deb00",
}

# ゆうが実物の箱と PMDA で確認した日と品。確認済みの品は「出典が弱い値」（low）も差分とバッジに使う（L-20261103-02）。
# L-20261103-03 の追加21品は未確認（verifiedOn=null、画面に「未確認」）
VERIFIED_ON = "2026-11-03"
VERIFIED = {sku[0] for sku in SKUS[:19]}

# 画面とスキーマで必須の数値。調べて見つからない品は入れず、除外の一覧に出す（ゆうが補う）
REQUIRED = [("dailyMaxUnits", "1日の最大量"), ("timesPerDay", "1日の回数"), ("contentQty", "内容量"), ("contentUnit", "内容量の単位")]

# 数値の代わりになる表記の欄（外用だけ）
TEXT_OF = {"dailyMaxUnits": "dailyMaxText", "timesPerDay": "timesPerDayText"}

RISK = {"要指導": "要指導", "要指導医薬品": "要指導", "第1類": "第1類", "指定第2類": "指定第2類", "第2類": "第2類", "第3類": "第3類"}


def norm(name: str) -> str:
    return unicodedata.normalize("NFKC", name).replace("−", "-").replace(" ", "").lower()


def doping_class(raw: str) -> str | None:
    text = unicodedata.normalize("NFKC", raw).replace("\t", "").strip()
    if not text:
        return None
    if "セクション" in text:
        timing, _, section = text.partition("セクション")
        return f"{section.lstrip(':').strip()}（{timing.split('(')[0]}）"
    return text


def main(catalog_path: str, images_path: str, out_path: str, *research_paths: str) -> None:
    rows = {r["id"]: r for r in csv.DictReader(open(catalog_path, encoding="utf-8-sig"))}
    images = json.load(open(images_path, encoding="utf-8"))
    research = {r["name"]: r for p in research_paths for r in json.load(open(p, encoding="utf-8"))}

    skus, skipped = [], []
    for sku_id, med_id, kind, group, efficacy in SKUS:
        row = rows[med_id]
        name = row["製品名"]
        found = research.get(name)
        if not found or not found.get("jan"):
            skipped.append(f"{name}（JAN 未確認）")
            continue
        # 外用で上限がない品（「1日数回」「適量」）は数値の代わりに添付文書の表記があればよい（L-20261103-25）
        lacking = [
            label for key, label in REQUIRED
            if not found.get(key) and not (found.get("route") == "external" and found.get(TEXT_OF.get(key, "")))
        ]
        if lacking:
            skipped.append(f"{name}（{'・'.join(lacking)} 未確認）")
            continue
        ingredients = [unicodedata.normalize("NFKC", i).replace("−", "-").strip() for i in row["成分"].split("\n") if i.strip()]
        amounts = {norm(f[0]): f for f in found["facts"]}
        low = set(map(norm, found.get("low", [])))
        facts = []
        for ingredient in ingredients:
            hit = amounts.get(norm(ingredient))
            amount, unit = (hit[1], hit[2]) if hit and hit[1] is not None else (None, None)
            facts.append({
                "ingredient": ingredient,
                "ingredientClasses": (["抗ヒスタミン剤"] if any(a in ingredient for a in ANTIHISTAMINES) else [])
                + (["副交感神経遮断剤"] if any(a in ingredient for a in PARASYMPATHOLYTICS) else []),
                "amountPerDay": amount,
                "unit": unit,
                # 量が見つからない・出典が弱い値は差分とバッジに使わない（rules §4-8）
                "uncertain": amount is None or (norm(ingredient) in low and sku_id not in VERIFIED),
            })
        skus.append({
            "id": sku_id,
            "jan": found["jan"],
            # 品名が変わっている品は今の品名（例：ナロンエース → ナロンエースT）
            "name": found.get("displayName") or name,
            "maker": found.get("maker") or row["メーカー名"],
            "riskClass": RISK[found.get("riskClass") or row["分類"]],
            "kind": kind,
            "noticeGroupId": group,
            "efficacyGroups": efficacy,
            "route": found.get("route", "internal"),
            "crudeDrugMain": kind in CRUDE_DRUG_MAIN_KINDS or name in CRUDE_DRUG_MAIN,
            "dailyMaxUnits": found["dailyMaxUnits"],
            "timesPerDay": found["timesPerDay"],
            "timesPerDayText": found.get("timesPerDayText") if found["timesPerDay"] is None else None,
            "dailyMaxText": found.get("dailyMaxText") if found["dailyMaxUnits"] is None else None,
            "contentQty": found["contentQty"],
            "contentUnit": found["contentUnit"],
            "facts": facts,
            "pmdaUrl": row["pmda添付文書URL"],
            "docRevisedOn": None,
            "enteredBy": "ゆう（既存データ）＋公開情報",
            "verifiedOn": VERIFIED_ON if sku_id in VERIFIED else None,
            "imageUrl": IMAGE_OVERRIDE.get(name) or images.get(name),
            "source": {"label": "添付文書を PMDA で開く", "url": row["pmda添付文書URL"]},
            "quotes": {"efficacy": None, "ingredients": ingredients, "dosage": None},
            "flags": {
                "drowsyMention": any(d in i for i in ingredients for d in DROWSY),
                "dopingRelated": row["禁止物質あり"] == "禁止物質あり",
                "dopingClass": doping_class(row["競技会区分"]),
            },
            "research": [{"label": label, "url": url} for label, url in found["research"]],
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(skus, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(skus)} 品を書き出しました")
    for s in skipped:
        print(f"除外：{s}")


if __name__ == "__main__":
    main(*sys.argv[1:])
