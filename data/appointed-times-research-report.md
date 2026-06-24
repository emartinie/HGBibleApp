# Appointed Times + Biblical History Dataset

## Purpose

This first pass designs a foundation for a Sacred Time + Biblical History dataset. It is intentionally broader than a feast-day list. The goal is to connect biblical events, appointed times, biblical calendar dates, traditional chronology, historical chronology, and Gregorian alignment where known, while preserving uncertainty and multiple viewpoints.

Files created:

- `appointed-times-schema.json`
- `appointed-times-sample.json`
- `appointed-times-research-report.md`

## Proposed Schema Explanation

The schema is designed around a single event record. A record may be a biblical event, an appointed time, a fast day, a traditional chronology marker, or a historical event.

Core fields:

- `id`: Stable lowercase identifier for linking records across cards and timelines.
- `title`: Human-readable title.
- `category`: Array of categories so one entry can be both `temple` and `fast_day`, or both `messiah` and `appointed_time`.
- `date_type`: Labels how the date should be understood. Options include `fixed_hebrew_date`, `relative_biblical_date`, `traditional_association`, `historical_reconstruction`, `gregorian_known`, `undated`, and `disputed`.
- `hebrew_date`: Structured Hebrew or biblical-calendar date, with a `calendar_basis` and `certainty`.
- `traditional_year`: Traditional chronology label, usually AM where available, with its own confidence and source note.
- `gregorian_date`: Gregorian or historical alignment where known or reconstructed. This remains separate from Hebrew and traditional dates.
- `scripture_refs`: Biblical references connected to the entry.
- `themes`: Tags for filtering, study cards, visualization, and search.
- `description`: Plain-language summary that does not force theological or chronological conclusions.
- `related_events`: Other event IDs.
- `related_appointed_times`: Related appointed-time IDs.
- `chronology_confidence`: Overall confidence label for the entry.
- `traditions`: Specific tradition claims, each with `certainty`, `tradition`, and `source_note`.
- `viewpoints`: Preserves competing readings without collapsing them.
- `source_notes`: Research notes and links.
- `notes`: Owner-facing editorial cautions.
- `status`: Draft workflow label.

The most important design choice is separating:

- what the biblical text explicitly dates,
- what tradition assigns,
- what historians reconstruct,
- what later theological readings associate,
- what remains unknown.

## Sample Entries Created

The proof-of-concept dataset currently includes 30 entries:

- `creation-week`
- `adam-and-eve-created`
- `fall-in-eden`
- `flood-begins`
- `ark-rests`
- `abraham-born-traditional`
- `isaac-born-passover-tradition`
- `akedah-rosh-hashanah-reading`
- `passover`
- `exodus-passover`
- `red-sea-crossing-tradition`
- `shavuot`
- `sinai-torah-given`
- `tablets-broken-seventeenth-tammuz`
- `second-tablets-yom-kippur`
- `spies-report-tisha-bav`
- `entry-into-land`
- `first-passover-in-land`
- `temple-dedication-sukkot`
- `tenth-tevet-siege-begins`
- `tisha-bav-first-temple-destroyed`
- `return-under-cyrus`
- `second-temple-completed`
- `messiah-passover-crucifixion`
- `firstfruits`
- `messiah-resurrection-firstfruits`
- `yom-teruah-rosh-hashanah`
- `yom-kippur`
- `sukkot`
- `second-temple-destroyed`

This is more than the requested approximate 20 because several entries are paired deliberately. For example, `passover` is the appointed time, while `exodus-passover` is the historical/biblical event. That separation should help future cards avoid mixing an annual observance with a one-time event. This is still a first-pass proof of concept, not an attempt to build the full dataset.

## Major Traditions Discovered or Captured

### Creation and Tishrei / Nisan

Rabbinic discussion preserves more than one creation chronology. One opinion associates creation with Tishrei, and another with Nisan. The sample data does not force one view. It records the 1 Tishrei / Rosh Hashanah association for Adam and Eve as traditional, not as an explicit biblical date.

Source anchor:

- [Tishrei overview](https://en.wikipedia.org/wiki/Tishrei)
- [Rosh Hashanah overview](https://en.wikipedia.org/wiki/Rosh_Hashanah)
- Traditional reference to Babylonian Talmud, Rosh Hashanah 10b-11a

### Passover Associations

Passover is explicitly dated in Torah to the first month, fourteenth day at twilight, with the meal beginning as the fifteenth day begins. The Exodus is explicitly connected to 15 Nisan in Numbers 33:3. Traditional Jewish chronology labels the Exodus as AM 2448 in Seder Olam-style reckoning.

The sample also captures:

- Isaac's birth on 15 Nisan as a tradition.
- Messiah's death in Passover season as a New Testament and theological association, while preserving chronology disputes between Gospel harmonization models.

Source anchors:

- [Passover overview](https://en.wikipedia.org/wiki/Passover)
- [Nisan overview](https://en.wikipedia.org/wiki/Nisan)
- [Seder Olam Rabbah overview](https://en.wikipedia.org/wiki/Seder_Olam_Rabbah)

### Firstfruits Associations

Firstfruits is a key test case because calendar interpretation differs. Leviticus says the offering occurs on the day after the Sabbath. Rabbinic practice begins the Omer on 16 Nisan. Other traditions read the Sabbath as the weekly Sabbath during Unleavened Bread.

The sample records Messiah's resurrection and Firstfruits as a theological/calendar association based especially on 1 Corinthians 15:20-23, not as a forced date claim.

Source anchors:

- [First Fruits overview](https://en.wikipedia.org/wiki/First_Fruits)
- [Passover Omer overview](https://en.wikipedia.org/wiki/Passover)

### Shavuot and Sinai

Shavuot is biblically connected to the count of weeks and harvest. Rabbinic tradition strongly associates it with the giving of Torah at Sinai. The Torah itself does not explicitly say "the Torah was given on Shavuot," and the Talmudic discussion preserves a 6 Sivan / 7 Sivan distinction.

Source anchor:

- [Shavuot overview](https://en.wikipedia.org/wiki/Shavuot)

### Seventeenth of Tammuz

Mishnah Ta'anit 4:6 associates five calamities with 17 Tammuz, including Moses breaking the tablets. This is useful for linking the Sinai narrative to the fast-day cycle.

Source anchor:

- [Seventeenth of Tammuz overview](https://en.wikipedia.org/wiki/Seventeenth_of_Tammuz)

### Yom Kippur

The Day of Atonement itself is explicitly dated in Torah to 10 Tishrei. The tradition that Moses returned with the second tablets and forgiveness on Yom Kippur is included, but marked as needing primary-source review in the sample.

Source anchors:

- Leviticus 16
- Leviticus 23:26-32

### Sukkot and Temple Dedication

Solomon's Temple dedication is placed in the seventh month in 1 Kings 8 and 2 Chronicles 5-7, with a feast-season overlap. The dataset connects it to Sukkot, while avoiding a stronger day-level claim until primary source review is done.

Source anchors:

- 1 Kings 8
- 2 Chronicles 5-7

### Tisha B'Av

Mishnah Ta'anit 4:6 associates five calamities with 9 Av, including:

- the spies' report and wilderness judgment,
- destruction of the First Temple,
- destruction of the Second Temple.

The sample also preserves the biblical date tension around the First Temple destruction: 2 Kings and Jeremiah emphasize dates around 7-10 Av, while rabbinic mourning centers on 9 Av.

Source anchor:

- [Tisha B'Av overview](https://en.wikipedia.org/wiki/Tisha_B%27Av)

### Tenth of Tevet

The siege of Jerusalem begins on the tenth day of the tenth month in 2 Kings 25:1 and Ezekiel 24:1-2. This is an explicit biblical date and later fast-day marker.

Source anchor:

- [Tenth of Tevet overview](https://en.wikipedia.org/wiki/Tenth_of_Tevet)

## Known Chronology Disputes

### Traditional AM Chronology vs Historical Chronology

Seder Olam-style traditional chronology and modern historical chronology do not always align. The First Temple destruction is a major example:

- Traditional Jewish chronology often labels the destruction as AM 3338, roughly 423/422 BCE.
- Modern historical chronology often places it in 586 or 587 BCE.

The sample keeps both labels separate rather than choosing one.

Source anchor:

- [Seder Olam Rabbah overview](https://en.wikipedia.org/wiki/Seder_Olam_Rabbah)

### Exodus Dating

The sample records the traditional Exodus year as AM 2448 but does not assign a Gregorian year. Full expansion will need an owner decision on whether to include early Exodus, late Exodus, traditional Jewish, Ussher-style, or multiple parallel chronology tracks.

### Flood Calendar Basis

Genesis gives month numbers and days for the Flood, but applying later Hebrew month names depends on whether the calendar basis is treated as Nisan-based, Tishrei/civil, or pre-Mosaic. The sample therefore records the biblical month number first and preserves viewpoint notes.

### Firstfruits Calendar Interpretation

Firstfruits can be modeled differently depending on how "the day after the Sabbath" is interpreted:

- Rabbinic fixed practice: Omer begins 16 Nisan.
- Weekly Sabbath reading: Firstfruits falls on the day after the weekly Sabbath during Unleavened Bread.

This matters for resurrection associations and visual calendar logic.

### Passion Week Chronology

The New Testament places Messiah's death and resurrection in Passover/Unleavened Bread season, but exact Nisan date and Gregorian year reconstructions vary. The sample uses `historical_disputed` and `thematic_association` rather than forcing a harmonized chronology.

## Questions Requiring Owner Review

1. Should the production dataset support multiple chronology tracks as first-class data, such as `traditional_jewish`, `academic_historical`, `ussher`, and `messianic_study_view`?

2. Should appointed times be separate records from historical events, with relationships between them, as in this sample?

3. Should the app use `Yom Teruah`, `Rosh Hashanah`, or both in display labels?

4. How should the app handle non-rabbinic calendar readings of Firstfruits and Shavuot?

5. Should Messiah-related entries remain in the same dataset or be placed in a linked layer so Jewish, Christian, and Messianic readings can be filtered?

6. What level of source review is required before an association moves from `needs_review` to `approved`?

7. Should Gregorian alignments be shown in the UI when they are approximate, disputed, or proleptic?

8. Should traditional associations from later Jewish history, such as events listed in "Today in Jewish History" style calendars, be included after biblical-period entries are stable?

## Recommendations for Full Dataset Expansion

1. Keep this as a data-first project before wiring it into app behavior.

2. Split the full dataset into layers:

- `appointed_times`: annual sacred days and biblical calendar structure.
- `biblical_events`: Creation through Second Temple and New Testament events.
- `traditional_associations`: rabbinic, liturgical, and later traditional links.
- `historical_chronology`: BCE/CE scholarly reconstruction.
- `visualization_edges`: curated links for MainStage, timeline, Prezi, and card navigation.

3. Add a source-quality workflow:

- `explicit_biblical_date`
- `strong_tradition`
- `traditional`
- `historical_consensus`
- `historical_disputed`
- `thematic_association`
- `uncertain`
- `unknown`

4. Add owner-approved source tiers:

- Tier 1: Biblical text.
- Tier 2: Mishnah/Talmud/Midrash primary references.
- Tier 3: Classical Jewish commentators and liturgy.
- Tier 4: Modern academic/historical references.
- Tier 5: Christian/Messianic theological associations.
- Tier 6: Teaching notes or owner-created study associations.

5. Build small UI consumers only after schema review:

- Calendar Card can read fixed Hebrew dates.
- Today Card can surface entries matching a date.
- MainStage can show related themes.
- Feast Studies can pull related biblical events and traditions.
- Timeline can sort by chosen chronology track.
- Prezi integration can use `related_events`, `themes`, and `visualization_edges`.

6. Add validation before production use. The current schema describes one event record. A later pass should add a wrapper schema for complete dataset files with `metadata` and `entries`.

## First-Pass Assumptions

- Files belong in `data/` because this is a dataset and no app behavior was requested.
- The sample should include more than feast days and should preserve event/appointed-time separation.
- "Approximately 20" allowed a slightly larger sample because paired entries made the model clearer.
- Where source review was incomplete, entries are marked `needs_review` rather than presented as settled.
- No app code, routing, card rendering, global state, or CSS was changed.
