import type { Customer, Order, OrderItem, PayMethod, Product } from '../types';

/* All data here is fictional sample data. Prices are in BDT (৳). */

// name | strength | generic | manufacturer | category | form | unit price
const RAW = `
Napa|500mg|Paracetamol|Beximco|Pain Relievers|Tablet|1.5
Napa Extra|665mg|Paracetamol + Caffeine|Beximco|Pain Relievers|Tablet|2.5
Ace|500mg|Paracetamol|Square|Pain Relievers|Tablet|1.2
Ace Plus|500mg|Paracetamol + Caffeine|Square|Pain Relievers|Tablet|2.2
Brufen|400mg|Ibuprofen|Square|Pain Relievers|Tablet|4
Tory|90mg|Etoricoxib|Square|Pain Relievers|Tablet|15
Seclo|20mg|Omeprazole|Square|Gastric|Capsule|6
Maxpro|20mg|Esomeprazole|Renata|Gastric|Tablet|7
Losectil|20mg|Omeprazole|Eskayef|Gastric|Capsule|6.5
Pantonix|20mg|Pantoprazole|Square|Gastric|Tablet|6
Antacid Plus|200ml|Aluminium + Magnesium|Beximco|Gastric|Syrup|85
Fexo|120mg|Fexofenadine|Square|Allergy Medication|Tablet|8
Alatrol|10mg|Cetirizine|Square|Allergy Medication|Tablet|2.5
Monas|10mg|Montelukast|Acme|Allergy Medication|Tablet|14
Lorin|10mg|Loratadine|Beximco|Allergy Medication|Tablet|3
Moxacil|500mg|Amoxicillin|Square|Antibiotics|Capsule|8
Ciprocin|500mg|Ciprofloxacin|Square|Antibiotics|Tablet|10
Zimax|500mg|Azithromycin|Square|Antibiotics|Tablet|35
Cef-3|200mg|Cefixime|Square|Antibiotics|Capsule|28
Doxicap|100mg|Doxycycline|Renata|Antibiotics|Capsule|7
Filmet|400mg|Metronidazole|Beximco|Antibiotics|Tablet|2.5
Glucomin|500mg|Metformin|Aristopharma|Diabetes Care|Tablet|3
Reclide|80mg|Gliclazide|Square|Diabetes Care|Tablet|4.5
Sitagil|50mg|Sitagliptin|Incepta|Diabetes Care|Tablet|22
Insulin Pen|100IU/ml|Human Insulin|Novo Nordisk|Diabetes Care|Injection|650
Angilock|50mg|Losartan|Square|Cardiovascular|Tablet|6
Amlo|5mg|Amlodipine|Square|Cardiovascular|Tablet|3
Atova|10mg|Atorvastatin|Square|Cardiovascular|Tablet|9
Bisocor|5mg|Bisoprolol|Incepta|Cardiovascular|Tablet|6
Plagrin|75mg|Clopidogrel|Square|Cardiovascular|Tablet|6
Ventolin|100mcg|Salbutamol|GSK|Respiratory Medicines|Inhaler|220
Sultolin|4mg|Salbutamol|Square|Respiratory Medicines|Tablet|1.2
Expec|100ml|Bromhexine|Square|Respiratory Medicines|Syrup|70
Bricanyl|2.5mg|Terbutaline|AstraZeneca|Respiratory Medicines|Tablet|5
Calbo-D|500mg|Calcium + Vitamin D3|Square|Vitamins & Supplements|Tablet|8
Ostocal-D|600mg|Calcium + Vitamin D3|Eskayef|Vitamins & Supplements|Tablet|9
Ceevit|250mg|Vitamin C|Square|Vitamins & Supplements|Tablet|2.5
D-Rise|2000IU|Vitamin D3|Square|Vitamins & Supplements|Capsule|12
Zinc Plus|20mg|Zinc Sulphate|Renata|Vitamins & Supplements|Tablet|3.5
B-Plex||Vitamin B Complex|Square|Vitamins & Supplements|Tablet|2
Orsaline-N||ORS Saline|Square|Vitamins & Supplements|Sachet|5
Virux|400mg|Acyclovir|Square|Antiviral Drugs|Tablet|12
Tamivir|75mg|Oseltamivir|Square|Antiviral Drugs|Capsule|60
Entavir|0.5mg|Entecavir|Beacon|Antiviral Drugs|Tablet|45
Valvir|500mg|Valacyclovir|Incepta|Antiviral Drugs|Tablet|38
Napa Extend|665mg|Paracetamol|Beximco|Pain Relievers|Tablet|2
Napa|60ml|Paracetamol|Beximco|Pain Relievers|Syrup|35
Clofenac|50mg|Diclofenac Sodium|Square|Pain Relievers|Tablet|4
Aceclo|100mg|Aceclofenac|Square|Pain Relievers|Tablet|6
Naprox|500mg|Naproxen|Square|Pain Relievers|Tablet|8
Torax|10mg|Ketorolac|Square|Pain Relievers|Tablet|12
Maxgalin|75mg|Pregabalin|Square|Pain Relievers|Capsule|12
Gabatin|300mg|Gabapentin|Square|Pain Relievers|Capsule|10
Diclofen Gel|20g|Diclofenac|Square|Pain Relievers|Cream|90
Nexum|20mg|Esomeprazole|Square|Gastric|Tablet|7
Sergel|20mg|Esomeprazole|Healthcare|Gastric|Capsule|7
Rablet|20mg|Rabeprazole|Square|Gastric|Tablet|6
Motigut|10mg|Domperidone|Square|Gastric|Tablet|3
Motigut|60ml|Domperidone|Square|Gastric|Syrup|55
Emistat|4mg|Ondansetron|Square|Gastric|Tablet|5
Imotil|2mg|Loperamide|Square|Gastric|Capsule|3
Lactulose Syrup|100ml|Lactulose|Square|Gastric|Syrup|180
Bisalax|5mg|Bisacodyl|Beximco|Gastric|Tablet|2
Deslor|5mg|Desloratadine|Square|Allergy Medication|Tablet|6
Levocet|5mg|Levocetirizine|Square|Allergy Medication|Tablet|5
Chlorphen|4mg|Chlorpheniramine|Square|Allergy Medication|Tablet|1
Alatrol|60ml|Cetirizine|Square|Allergy Medication|Syrup|55
Moxaclav|625mg|Amoxicillin + Clavulanic Acid|Square|Antibiotics|Tablet|35
Moxacil|100ml|Amoxicillin|Square|Antibiotics|Syrup|75
Leovox|500mg|Levofloxacin|Square|Antibiotics|Tablet|22
Azin|500mg|Azithromycin|Beximco|Antibiotics|Tablet|32
Cefim|200mg|Cefixime|Beximco|Antibiotics|Capsule|26
Clarimax|500mg|Clarithromycin|Beximco|Antibiotics|Tablet|40
Cefurox|500mg|Cefuroxime|Square|Antibiotics|Tablet|45
Cefradin|500mg|Cefradine|Square|Antibiotics|Capsule|9
Co-Trim|480mg|Cotrimoxazole|Square|Antibiotics|Tablet|2.5
Tinizol|500mg|Tinidazole|Square|Antibiotics|Tablet|4
Glucomin XR|500mg|Metformin SR|Aristopharma|Diabetes Care|Tablet|4
Glimy|2mg|Glimepiride|Beximco|Diabetes Care|Tablet|5
Pioglit|15mg|Pioglitazone|Square|Diabetes Care|Tablet|6
Vildaglip|50mg|Vildagliptin|Incepta|Diabetes Care|Tablet|20
Jardiance|10mg|Empagliflozin|Boehringer Ingelheim|Diabetes Care|Tablet|250
Trajenta|5mg|Linagliptin|Boehringer Ingelheim|Diabetes Care|Tablet|230
Lantus|100IU/ml|Insulin Glargine|Sanofi|Diabetes Care|Injection|1400
Accu-Chek Active Strips|50 strips|Glucose test strips|Roche|Diabetes Care|Other|1400
Tolmi|40mg|Telmisartan|Square|Cardiovascular|Tablet|8
Atenol|50mg|Atenolol|Square|Cardiovascular|Tablet|2.5
Metolar|50mg|Metoprolol|Renata|Cardiovascular|Tablet|3.5
Carvil|6.25mg|Carvedilol|Square|Cardiovascular|Tablet|5
Rosuva|10mg|Rosuvastatin|Square|Cardiovascular|Tablet|14
Aspirin Cardio|75mg|Aspirin|Square|Cardiovascular|Tablet|1.5
Lasix|40mg|Furosemide|Sanofi|Cardiovascular|Tablet|2
Aldactone|25mg|Spironolactone|Pfizer|Cardiovascular|Tablet|8
Angised|0.5mg|Glyceryl Trinitrate|Square|Cardiovascular|Tablet|3
Warfarin|5mg|Warfarin|Square|Cardiovascular|Tablet|4
Xarelto|20mg|Rivaroxaban|Bayer|Cardiovascular|Tablet|230
Brodil|100ml|Salbutamol|Square|Respiratory Medicines|Syrup|65
Seretide Evohaler|25/125mcg|Salmeterol + Fluticasone|GSK|Respiratory Medicines|Inhaler|1100
Budecort|200mcg|Budesonide|Beximco|Respiratory Medicines|Inhaler|600
Ambrox|30mg|Ambroxol|Square|Respiratory Medicines|Tablet|3
Tusca|100ml|Dextromethorphan|Square|Respiratory Medicines|Syrup|90
Neuro-B||Vitamin B1 + B6 + B12|Square|Vitamins & Supplements|Tablet|6
Mecobal|500mcg|Mecobalamin|Square|Vitamins & Supplements|Tablet|6
Omega-3|1000mg|Omega-3 Fish Oil|Square|Vitamins & Supplements|Capsule|12
Multivit||Multivitamin + Minerals|Square|Vitamins & Supplements|Tablet|4
Ferro-F||Iron + Folic Acid|Square|Vitamins & Supplements|Capsule|3.5
Folic Acid|5mg|Folic Acid|Square|Vitamins & Supplements|Tablet|1
E-Vit|400IU|Vitamin E|Square|Vitamins & Supplements|Capsule|8
Zinc Plus|100ml|Zinc Sulphate|Renata|Vitamins & Supplements|Syrup|50
Heplav|100mg|Lamivudine|Square|Antiviral Drugs|Tablet|20
Famvir|500mg|Famciclovir|Novartis|Antiviral Drugs|Tablet|85
Clotrim|1%|Clotrimazole|Square|Dermatology|Cream|45
Betnovate|0.1%|Betamethasone|GSK|Dermatology|Cream|80
Mupicin|2%|Mupirocin|Square|Dermatology|Cream|120
Ketoral|2%|Ketoconazole|Eskayef|Dermatology|Other|250
Scabex|5%|Permethrin|Square|Dermatology|Cream|70
Calamine Lotion|100ml|Calamine|Square|Dermatology|Other|60
Fluconal|150mg|Fluconazole|Square|Dermatology|Capsule|25
Moxin Eye Drops|0.5%|Moxifloxacin|Square|Eye & Ear|Drops|120
Tobrex|0.3%|Tobramycin|Alcon|Eye & Ear|Drops|160
Cipro Ear Drops|0.3%|Ciprofloxacin|Square|Eye & Ear|Drops|85
Tear Drops|0.5%|Carboxymethylcellulose|Square|Eye & Ear|Drops|110
Gripe Water|130ml|Gripe Water|Woodward's|Baby & Mother|Syrup|110
Sudocrem|60g|Zinc Oxide|Teva|Baby & Mother|Cream|420
Digital Thermometer|1 pc||Generic|Medical Supplies|Other|220
BP Monitor|HEM-7120||Omron|Medical Supplies|Other|3200
Accu-Chek Active Meter|1 pc||Roche|Medical Supplies|Other|1800
Surgical Mask|50 pcs||Generic|Medical Supplies|Other|150
Gloves|100 pcs||Generic|Medical Supplies|Other|480
Crepe Bandage|4 inch||Generic|Medical Supplies|Other|60
Cotton Roll|100g||Generic|Medical Supplies|Other|45
Disposable Syringe|5ml||Generic|Medical Supplies|Other|8
Pregnancy Test Strip|1 pc||Generic|Medical Supplies|Other|40
Band-Aid|20 pcs||Johnson & Johnson|Medical Supplies|Other|55
Savlon|100ml|Chlorhexidine + Cetrimide|ACI|Medical Supplies|Other|65
Dettol|100ml|Chloroxylenol|Reckitt|Medical Supplies|Other|70
Ponstan|500mg|Mefenamic Acid|Pfizer|Pain Relievers|Tablet|6
Celebrex|200mg|Celecoxib|Pfizer|Pain Relievers|Capsule|20
Feldene|20mg|Piroxicam|Pfizer|Pain Relievers|Capsule|8
Tizan|2mg|Tizanidine|Square|Pain Relievers|Tablet|5
Thiocol|4mg|Thiocolchicoside|Square|Pain Relievers|Capsule|18
Tory|60mg|Etoricoxib|Square|Pain Relievers|Tablet|11
Clofenac|75mg/3ml|Diclofenac Sodium|Square|Pain Relievers|Injection|15
Napa|1000mg|Paracetamol|Beximco|Pain Relievers|Tablet|3.5
Ace|120ml|Paracetamol|Square|Pain Relievers|Syrup|40
Aceclo|200mg SR|Aceclofenac|Square|Pain Relievers|Tablet|9
Pantonix|40mg|Pantoprazole|Square|Gastric|Tablet|9
Nexum|40mg|Esomeprazole|Square|Gastric|Tablet|11
Seclo|40mg|Omeprazole|Square|Gastric|Capsule|9
Sucral|1g|Sucralfate|Square|Gastric|Tablet|12
Buscopan|10mg|Hyoscine Butylbromide|Sanofi|Gastric|Tablet|8
Meverin|135mg|Mebeverine|Square|Gastric|Tablet|6
Simecon|40mg|Simethicone|Square|Gastric|Tablet|2
Pro-Bio||Lactobacillus|Square|Gastric|Sachet|15
Udiliv|300mg|Ursodeoxycholic Acid|Abbott|Gastric|Tablet|25
Racecadotril|100mg|Racecadotril|Square|Gastric|Capsule|14
Emistat|4mg/2ml|Ondansetron|Square|Gastric|Injection|20
Pantonix IV|40mg|Pantoprazole|Square|Gastric|Injection|65
Zimax|200mg/5ml|Azithromycin|Square|Antibiotics|Syrup|140
Moxacil|250mg|Amoxicillin|Square|Antibiotics|Capsule|5
Cloxin|500mg|Cloxacillin|Square|Antibiotics|Capsule|9
Oflox|200mg|Ofloxacin|Square|Antibiotics|Tablet|9
Avelox|400mg|Moxifloxacin|Bayer|Antibiotics|Tablet|120
Almex|400mg|Albendazole|Square|Antibiotics|Tablet|8
Vermox|500mg|Mebendazole|Janssen|Antibiotics|Tablet|7
Ivera|6mg|Ivermectin|Square|Antibiotics|Tablet|9
Biltricide|600mg|Praziquantel|Bayer|Antibiotics|Tablet|40
Secnid|1g|Secnidazole|Square|Antibiotics|Tablet|20
Ornid|500mg|Ornidazole|Square|Antibiotics|Tablet|9
Cefpo|200mg|Cefpodoxime|Square|Antibiotics|Tablet|35
Linzo|600mg|Linezolid|Incepta|Antibiotics|Tablet|90
Meronem|1g|Meropenem|AstraZeneca|Antibiotics|Injection|1200
Ceftron|1g|Ceftriaxone|Beximco|Antibiotics|Injection|90
Filmet IV|500mg/100ml|Metronidazole|Beximco|Antibiotics|Injection|55
Gentamicin|80mg/2ml|Gentamicin|Square|Antibiotics|Injection|10
Amikacin|500mg/2ml|Amikacin|Square|Antibiotics|Injection|45
Cipro IV|200mg/100ml|Ciprofloxacin|Square|Antibiotics|Injection|120
Itra|100mg|Itraconazole|Square|Antibiotics|Capsule|25
Terbinafine|250mg|Terbinafine|Square|Antibiotics|Tablet|20
Fexo|180mg|Fexofenadine|Square|Allergy Medication|Tablet|12
Atarax|25mg|Hydroxyzine|UCB|Allergy Medication|Tablet|4
Cypro|4mg|Cyproheptadine|Square|Allergy Medication|Tablet|1.5
Montelukast|5mg|Montelukast|Acme|Allergy Medication|Tablet|10
Histacin|2mg|Chlorpheniramine|Square|Allergy Medication|Tablet|0.8
Cold Rid||Paracetamol + Pseudoephedrine + Chlorpheniramine|Square|Allergy Medication|Tablet|3
Actifed|100ml|Pseudoephedrine + Triprolidine|GSK|Allergy Medication|Syrup|95
Otrivin|0.1%|Xylometazoline|Novartis|Allergy Medication|Drops|90
Tussin|100ml|Guaifenesin|Square|Respiratory Medicines|Syrup|85
Ventolin Nebules|2.5mg/2.5ml|Salbutamol|GSK|Respiratory Medicines|Other|20
Ipratropium Nebules|0.5mg|Ipratropium|Square|Respiratory Medicines|Other|30
Deflux|200mg|Doxofylline|Square|Respiratory Medicines|Tablet|12
Mucolyt|100ml|Ambroxol|Square|Respiratory Medicines|Syrup|70
Seretide Evohaler|25/250mcg|Salmeterol + Fluticasone|GSK|Respiratory Medicines|Inhaler|1400
Foracort|200mcg|Formoterol + Budesonide|Beximco|Respiratory Medicines|Inhaler|750
Tiotropium|18mcg|Tiotropium|Square|Respiratory Medicines|Inhaler|650
Glucomin|850mg|Metformin|Aristopharma|Diabetes Care|Tablet|4.5
Diamicron MR|60mg|Gliclazide|Servier|Diabetes Care|Tablet|18
Daonil|5mg|Glibenclamide|Sanofi|Diabetes Care|Tablet|2
Acarbose|50mg|Acarbose|Square|Diabetes Care|Tablet|9
Forxiga|10mg|Dapagliflozin|AstraZeneca|Diabetes Care|Tablet|200
NovoRapid|100IU/ml|Insulin Aspart|Novo Nordisk|Diabetes Care|Injection|900
Mixtard 30|100IU/ml|Human Insulin|Novo Nordisk|Diabetes Care|Injection|650
Pen Needle|31G 8mm|Pen needles|BD|Diabetes Care|Other|1200
Lancets|100 pcs|Lancets|Generic|Diabetes Care|Other|200
Glimepiride + Metformin|2mg/500mg|Glimepiride + Metformin|Square|Diabetes Care|Tablet|9
Sitagil|100mg|Sitagliptin|Incepta|Diabetes Care|Tablet|30
Valsartan|80mg|Valsartan|Novartis|Cardiovascular|Tablet|20
Olmecor|20mg|Olmesartan|Square|Cardiovascular|Tablet|15
Nebix|5mg|Nebivolol|Square|Cardiovascular|Tablet|12
Ramipril|5mg|Ramipril|Square|Cardiovascular|Tablet|8
Enalapril|5mg|Enalapril|Square|Cardiovascular|Tablet|3
Hydrochlorothiazide|25mg|Hydrochlorothiazide|Square|Cardiovascular|Tablet|2
Natrilix|1.5mg|Indapamide|Servier|Cardiovascular|Tablet|12
Isosorbide|20mg|Isosorbide Mononitrate|Square|Cardiovascular|Tablet|4
Lanoxin|0.25mg|Digoxin|Aspen|Cardiovascular|Tablet|3
Cordarone|200mg|Amiodarone|Sanofi|Cardiovascular|Tablet|18
Lipanthyl|160mg|Fenofibrate|Abbott|Cardiovascular|Tablet|22
Ezetrol|10mg|Ezetimibe|MSD|Cardiovascular|Tablet|50
Atova|20mg|Atorvastatin|Square|Cardiovascular|Tablet|14
Rosuva|20mg|Rosuvastatin|Square|Cardiovascular|Tablet|20
Pentox|400mg|Pentoxifylline|Square|Cardiovascular|Tablet|9
Vastarel|35mg|Trimetazidine|Servier|Cardiovascular|Tablet|12
Amlo|10mg|Amlodipine|Square|Cardiovascular|Tablet|5
Angilock|100mg|Losartan|Square|Cardiovascular|Tablet|9
Plagrin|150mg|Clopidogrel|Square|Cardiovascular|Tablet|12
Clonatril|0.5mg|Clonazepam|Square|Neuro & Psychiatry|Tablet|3
Alprax|0.5mg|Alprazolam|Square|Neuro & Psychiatry|Tablet|3
Serta|50mg|Sertraline|Square|Neuro & Psychiatry|Tablet|9
Opram|10mg|Escitalopram|Incepta|Neuro & Psychiatry|Tablet|8
Tryptin|10mg|Amitriptyline|Square|Neuro & Psychiatry|Tablet|2
Levipil|500mg|Levetiracetam|Square|Neuro & Psychiatry|Tablet|18
Tegretol|200mg|Carbamazepine|Novartis|Neuro & Psychiatry|Tablet|7
Valparin|500mg|Sodium Valproate|Square|Neuro & Psychiatry|Tablet|9
Donecept|5mg|Donepezil|Square|Neuro & Psychiatry|Tablet|15
Vertin|16mg|Betahistine|Square|Neuro & Psychiatry|Tablet|8
Flunarin|5mg|Flunarizine|Square|Neuro & Psychiatry|Tablet|5
Sumatrin|50mg|Sumatriptan|Square|Neuro & Psychiatry|Tablet|20
Zolpi|10mg|Zolpidem|Square|Neuro & Psychiatry|Tablet|10
Piracetam|800mg|Piracetam|Square|Neuro & Psychiatry|Tablet|6
Primolut-N|5mg|Norethisterone|Bayer|Women's Health|Tablet|8
Trexa|500mg|Tranexamic Acid|Square|Women's Health|Tablet|9
Trexa|500mg/5ml|Tranexamic Acid|Square|Women's Health|Injection|60
Femicon||Levonorgestrel + Ethinylestradiol|Square|Women's Health|Tablet|40
Postinor-2|1.5mg|Levonorgestrel|Gedeon Richter|Women's Health|Tablet|90
Clotrim Vaginal|100mg|Clotrimazole|Square|Women's Health|Tablet|20
Clomid|50mg|Clomiphene|Sanofi|Women's Health|Tablet|25
Duphaston|10mg|Dydrogesterone|Abbott|Women's Health|Tablet|55
Evion|400mg|Vitamin E|Merck|Women's Health|Capsule|7
Tamsul|0.4mg|Tamsulosin|Square|Urology|Capsule|10
Finast|5mg|Finasteride|Square|Urology|Tablet|9
Oxybutin|5mg|Oxybutynin|Square|Urology|Tablet|5
Cital|100ml|Sodium Citrate|Square|Urology|Syrup|110
Nitrofur|100mg|Nitrofurantoin|Square|Urology|Capsule|8
Thyrox|50mcg|Levothyroxine|Square|Thyroid & Hormones|Tablet|3
Thyrox|100mcg|Levothyroxine|Square|Thyroid & Hormones|Tablet|4.5
Carbimazole|5mg|Carbimazole|Square|Thyroid & Hormones|Tablet|3
Predni|5mg|Prednisolone|Square|Thyroid & Hormones|Tablet|2
Dexona|0.5mg|Dexamethasone|Square|Thyroid & Hormones|Tablet|1.5
Dexona|4mg/ml|Dexamethasone|Square|Thyroid & Hormones|Injection|12
Medrol|16mg|Methylprednisolone|Pfizer|Thyroid & Hormones|Tablet|25
Hydrocort|100mg|Hydrocortisone|Square|Thyroid & Hormones|Injection|55
Normal Saline|500ml|Sodium Chloride 0.9%|Beximco|Injectables & Fluids|Injection|55
Ringer's Lactate|500ml|Ringer's Lactate|Beximco|Injectables & Fluids|Injection|60
Dextrose 5%|500ml|Dextrose|Beximco|Injectables & Fluids|Injection|60
Mecobal|500mcg/ml|Mecobalamin|Square|Injectables & Fluids|Injection|40
Tetanus Toxoid|0.5ml|Tetanus Toxoid|Incepta|Injectables & Fluids|Injection|25
Adrenaline|1mg/ml|Adrenaline|Square|Injectables & Fluids|Injection|20
Vitamin K|10mg/ml|Phytomenadione|Square|Injectables & Fluids|Injection|25
Furosemide|20mg/2ml|Furosemide|Square|Injectables & Fluids|Injection|8
Terbinafine|1%|Terbinafine|Novartis|Dermatology|Cream|140
Virux Cream|5%|Acyclovir|Square|Dermatology|Cream|90
Fucidin|2%|Fusidic Acid|LEO|Dermatology|Cream|180
Hydrocort Cream|1%|Hydrocortisone|Square|Dermatology|Cream|60
Dermovate|0.05%|Clobetasol|GSK|Dermatology|Cream|110
Acnex|5%|Benzoyl Peroxide|Square|Dermatology|Cream|120
Differin|0.1%|Adapalene|Galderma|Dermatology|Cream|600
Silverex|1%|Silver Sulfadiazine|Square|Dermatology|Cream|130
Betadine|10%|Povidone Iodine|Mundipharma|Dermatology|Other|110
Minoxidil|5%|Minoxidil|Square|Dermatology|Other|450
Cetaphil|250ml|Moisturising lotion|Galderma|Dermatology|Other|1500
Ciprocin Eye|0.3%|Ciprofloxacin|Square|Eye & Ear|Drops|75
Tobradex|5ml|Tobramycin + Dexamethasone|Alcon|Eye & Ear|Drops|250
Timolol|0.5%|Timolol|Square|Eye & Ear|Drops|90
Xalatan|2.5ml|Latanoprost|Pfizer|Eye & Ear|Drops|1100
Opatanol|5ml|Olopatadine|Alcon|Eye & Ear|Drops|550
Tears Naturale|15ml|Hypromellose|Alcon|Eye & Ear|Drops|390
Waxsol|10ml|Docusate Sodium|Square|Eye & Ear|Drops|85
Clotrimazole Ear Drops|1%|Clotrimazole|Square|Eye & Ear|Drops|70
Chlorin|0.5%|Chloramphenicol|Square|Eye & Ear|Drops|35
Magnesium|250mg|Magnesium Oxide|Square|Vitamins & Supplements|Tablet|3
Ferro-F|100ml|Iron + Folic Acid|Square|Vitamins & Supplements|Syrup|70
D-Rise|50000IU|Vitamin D3|Square|Vitamins & Supplements|Capsule|30
Biotin|10mg|Biotin|Square|Vitamins & Supplements|Tablet|10
Aristovit-Z||Multivitamin + Zinc|Aristopharma|Vitamins & Supplements|Tablet|4
Glucosamine + Chondroitin|500mg/400mg|Glucosamine + Chondroitin|Square|Vitamins & Supplements|Capsule|12
Cod Liver Oil|100ml|Cod Liver Oil|Square|Vitamins & Supplements|Syrup|140
Vitamin D3 Drops|20ml|Vitamin D3|Square|Vitamins & Supplements|Drops|85
Ceevit|100mg/ml|Vitamin C|Square|Vitamins & Supplements|Drops|55
Calcium Sandoz|500mg|Calcium|Sandoz|Vitamins & Supplements|Tablet|9
Virux|200mg|Acyclovir|Square|Antiviral Drugs|Tablet|6
Tenofovir|300mg|Tenofovir|Square|Antiviral Drugs|Tablet|45
Sofosbuvir|400mg|Sofosbuvir|Beximco|Antiviral Drugs|Tablet|150
Daclatasvir|60mg|Daclatasvir|Beximco|Antiviral Drugs|Tablet|160
Lamivudine|150mg|Lamivudine|Square|Antiviral Drugs|Tablet|12
Napa Syrup Cold|60ml|Paracetamol + Pseudoephedrine|Beximco|Baby & Mother|Syrup|45
Zinc DS|20mg/5ml|Zinc Sulphate|Renata|Baby & Mother|Syrup|50
Cerelac Care|400g|Infant cereal|Nestle|Baby & Mother|Other|520
Johnson's Baby Oil|100ml|Baby oil|Johnson & Johnson|Baby & Mother|Other|220
Feeding Bottle|250ml||Generic|Baby & Mother|Other|180
Nasal Aspirator|1 pc||Generic|Baby & Mother|Other|120
Nebulizer Machine|1 pc||Omron|Medical Supplies|Other|3500
Pulse Oximeter|1 pc||Generic|Medical Supplies|Other|1200
Hot Water Bag|1 pc||Generic|Medical Supplies|Other|250
Knee Support|1 pc||Generic|Medical Supplies|Other|450
Glucose-D|200g|Glucose|Generic|Medical Supplies|Other|90
Sanitary Pad|8 pcs||Whisper|Medical Supplies|Other|60
Adult Diaper|10 pcs||Generic|Medical Supplies|Other|650
Hand Sanitizer|100ml|Alcohol 70%|Savlon|Medical Supplies|Other|90
`.trim();

export const CATEGORIES = [
  'Antibiotics',
  'Pain Relievers',
  'Vitamins & Supplements',
  'Antiviral Drugs',
  'Diabetes Care',
  'Cardiovascular',
  'Allergy Medication',
  'Respiratory Medicines',
  'Gastric',
  'Dermatology',
  'Eye & Ear',
  'Baby & Mother',
  'Medical Supplies',
  'Neuro & Psychiatry',
  "Women's Health",
  'Urology',
  'Thyroid & Hormones',
  'Injectables & Fluids',
];

export const FORMS = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Sachet', 'Cream', 'Drops', 'Other'];

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);
const iso = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(d);

export function makeProducts(): Product[] {
  const r = rng(42);
  const now = new Date();
  return RAW.split('\n').map((line, i) => {
    const [name, strength, generic, manufacturer, category, form, priceStr] = line.split('|');
    const price = Number(priceStr);
    const cost = Math.round(price * 0.74 * 100) / 100;
    const reorder = price > 100 ? 5 : 40;
    // Mix of healthy, low, out-of-stock, expiring-soon and expired stock
    let qty = Math.round((r() * 6 + 1.5) * reorder);
    let expiry = addDays(now, 120 + Math.floor(r() * 600));
    if (i % 11 === 3) qty = Math.floor(r() * reorder * 0.8) + 1; // low
    if (i % 13 === 5) qty = 0; // out
    if (i % 9 === 7) expiry = addDays(now, 8 + Math.floor(r() * 70)); // expiring soon
    if (i === 20) expiry = addDays(now, -20); // expired
    return {
      id: 'P' + String(i + 1).padStart(3, '0'),
      name,
      strength,
      generic,
      manufacturer,
      category,
      form,
      unit: form === 'Syrup' || form === 'Inhaler' || form === 'Injection' ? 'pcs' : form === 'Sachet' ? 'sachet' : 'pcs',
      barcode: '88' + String(10000000000 + i * 7919).slice(0, 11),
      batch: 'B' + (2400 + i * 3),
      expiry: iso(expiry),
      cost,
      price,
      qty,
      reorder,
      shelf: 'R' + (1 + (i % 6)) + '-' + String.fromCharCode(65 + (i % 5)),
    };
  });
}

const NAMES = [
  'Rahim Uddin', 'Karima Begum', 'Sabbir Hossain', 'Nusrat Jahan', 'Tanvir Ahmed',
  'Farhana Akter', 'Mahmudul Hasan', 'Sumaiya Islam', 'Arif Chowdhury', 'Shirin Sultana',
  'Imran Khan', 'Rokeya Khatun', 'Jahid Hasan', 'Mim Akter', 'Shafiqul Islam',
  'Taslima Nasrin', 'Kamrul Hasan', 'Lamia Rahman', 'Nasir Uddin', 'Popy Das',
  'Habib Rahman', 'Ayesha Siddika', 'Monir Hossain', 'Rima Chakma', 'Delwar Hossain',
];

export function makeCustomers(): Customer[] {
  const r = rng(7);
  const prefixes = ['013', '014', '015', '016', '017', '018', '019'];
  return NAMES.map((name, i) => ({
    id: 'C' + String(i + 1).padStart(3, '0'),
    name,
    phone: '+880' + '1' + prefixes[Math.floor(r() * prefixes.length)].slice(2) + String(Math.floor(r() * 90000000) + 10000000),
  }));
}

export function makeOrders(products: Product[], customers: Customer[]): Order[] {
  const r = rng(99);
  const now = new Date();
  const methods: PayMethod[] = ['Cash', 'Cash', 'Cash', 'bKash', 'bKash', 'Nagad', 'Card', 'Rocket', 'Bank Transfer', 'Due'];
  const orders: Order[] = [];
  const total = 60;
  for (let n = 1; n <= total; n++) {
    // spread across last 30 days, always a few "today"
    const daysAgo = n <= 6 ? 0 : Math.floor(r() * 30);
    const d = addDays(now, -daysAgo);
    d.setHours(9 + Math.floor(r() * 12), Math.floor(r() * 60), 0, 0);
    if (daysAgo === 0 && d.getTime() > now.getTime()) d.setTime(now.getTime() - n * 600000);

    const lineCount = 1 + Math.floor(r() * 3);
    const items: OrderItem[] = [];
    const picked = new Set<number>();
    for (let k = 0; k < lineCount; k++) {
      const idx = Math.floor(r() * products.length);
      if (picked.has(idx)) continue;
      picked.add(idx);
      const p = products[idx];
      const qty = p.price > 100 ? 1 : 1 + Math.floor(r() * 10);
      items.push({ productId: p.id, name: p.name, strength: p.strength, qty, price: p.price, cost: p.cost });
    }
    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const discount = r() < 0.2 ? Math.round(subtotal * 0.05) : 0;
    const totalAmt = Math.round((subtotal - discount) * 100) / 100;
    const method = methods[Math.floor(r() * methods.length)];
    const walkIn = r() < 0.35;
    const cust = walkIn ? undefined : customers[Math.floor(r() * customers.length)];
    const roll = r();
    let status: Order['status'] = 'Completed';
    let payStatus: Order['payStatus'] = method === 'Due' ? 'Due' : 'Paid';
    if (roll > 0.93) { status = 'Cancelled'; payStatus = 'Failed'; }
    else if (roll > 0.86) { status = 'In progress'; payStatus = 'Pending'; }
    else if (roll > 0.8) { status = 'Pending'; payStatus = 'Pending'; }
    orders.push({
      id: 'ORD' + String(n).padStart(3, '0'),
      invoiceNo: 'INV-' + (1000 + n),
      date: d.toISOString(),
      customerId: cust?.id,
      customerName: cust?.name ?? 'Walk-in',
      customerPhone: cust?.phone,
      items,
      subtotal,
      discount,
      vat: 0,
      total: totalAmt,
      paid: payStatus === 'Paid' ? totalAmt : 0,
      method,
      payStatus,
      status,
      cashier: 'Admin',
    });
  }
  return orders.sort((a, b) => b.date.localeCompare(a.date));
}

export function seedAll() {
  const products = makeProducts();
  const customers = makeCustomers();
  const orders = makeOrders(products, customers);
  return { products, customers, orders };
}

/** Bump when the built-in catalogue grows; existing installs then receive the new items once, automatically. */
export const CATALOG_VERSION = 2;

/** Pure helper: returns `existing` plus any catalogue products not already present (matched by name + strength). */
export function mergeCatalog(existing: Product[]): { products: Product[]; added: number } {
  const key = (p: Product) => (p.name + '|' + p.strength).toLowerCase();
  const have = new Set(existing.map(key));
  const fresh = makeProducts().filter((p) => !have.has(key(p)));
  let max = existing.reduce((m, p) => Math.max(m, Number(p.id.replace(/\D/g, '')) || 0), 0);
  const added = fresh.map((p) => ({ ...p, id: 'P' + String(++max).padStart(3, '0') }));
  return { products: [...existing, ...added], added: added.length };
}
