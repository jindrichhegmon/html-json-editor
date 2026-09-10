-- Aplikace „salda" (dashboard Salda Centrum & Datec): trvalé příkazy, které dřív žily v Softr tabulkách TPCLB / TPDATEC.
-- Databáze: JHN-PROJECT (spojení jhn). Idempotentní – lze spouštět opakovaně. Seed se vloží jen do prázdné tabulky.
IF OBJECT_ID('dbo.Salda_TrvalePrikazy') IS NULL
CREATE TABLE dbo.Salda_TrvalePrikazy (
  Id          int IDENTITY(1,1) PRIMARY KEY,
  Firma       nvarchar(10)   NOT NULL,          -- CLB | DATEC
  Popis       nvarchar(300)  NOT NULL,
  Frekvence   nvarchar(40)   NOT NULL,          -- Měsíční, Čtvrtletní, Pololetní, Roční, Týdenní, 14 dní, Jednorázově
  Castka      decimal(18,2)  NOT NULL,          -- kladná = výdaj (trvalý příkaz), záporná = pravidelný příjem
  DatumPlatby date           NOT NULL,          -- první / referenční datum platby; další termíny se odvozují z frekvence
  SoftrId     nvarchar(50)   NULL,              -- původní id záznamu v Softr (jen pro dohledání při migraci)
  Vytvoreno   datetime2      NOT NULL DEFAULT SYSDATETIME(),
  Zmeneno     datetime2      NULL
);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Salda_TrvalePrikazy_Firma')
  CREATE INDEX IX_Salda_TrvalePrikazy_Firma ON dbo.Salda_TrvalePrikazy (Firma, DatumPlatby);

-- Jednorázová migrace ze Softr (stav k 10. 9. 2026)
IF NOT EXISTS (SELECT 1 FROM dbo.Salda_TrvalePrikazy)
INSERT INTO dbo.Salda_TrvalePrikazy (Firma, Popis, Frekvence, Castka, DatumPlatby, SoftrId) VALUES
(N'CLB',   N'ALZA NEO MOBILY IPHONE',                                    N'Měsíční',     3575.00,   '2026-09-15', 'HnxpeIUiml1mew'),
(N'CLB',   N'ARLES PRONÁJEM DLE SM021/25',                               N'Měsíční',     786.50,    '2026-09-12', 'YXuNaQoXGvZ86t'),
(N'CLB',   N'ARLES SM076/22',                                            N'Měsíční',     1197.90,   '2026-09-14', 'OMl7CF3HlyEaIY'),
(N'CLB',   N'CALLYX DELL PC',                                            N'Roční',       6758.00,   '2026-09-29', 'zQbY6xJeXshx8r'),
(N'CLB',   N'CALLYX DELL PC',                                            N'Měsíční',     2180.00,   '2026-09-28', 'rhx96IpITyiqQt'),
(N'CLB',   N'Kia RIO',                                                   N'Měsíční',     4658.42,   '2026-09-27', 'RCdoV4hqpeKM6g'),
(N'CLB',   N'KIA RIO 7Z65985',                                           N'Měsíční',     4453.66,   '2026-10-08', 'bDouKsqdwHG0Il'),
(N'CLB',   N'Odvody',                                                    N'Jednorázově', 335842.00, '2026-09-21', '8MteuuxB09ofNv'),
(N'CLB',   N'ROZHLASOVÝ POPLATEK',                                       N'Čtvrtletní',  540.00,    '2026-10-15', 'np6n0LzTjaNxdS'),
(N'CLB',   N'SLEK - pojištění majetku a odpovědnosti sml. lékaře',       N'Roční',       10785.00,  '2027-02-23', 'EV5At8hPLVzYvi'),
(N'CLB',   N'Splátka úvěrů',                                             N'Měsíční',     52100.00,  '2026-09-30', 'ewmyFtTSiR9Jt3'),
(N'CLB',   N'TISKÁRNA',                                                  N'Měsíční',     786.50,    '2026-09-15', 'qhxelxTFZQ1aSW'),
(N'DATEC', N'Acrobat Pro - roční platba',                                N'Roční',       5967.00,   '2027-04-07', 'R3NOZ1cqGEQydf'),
(N'DATEC', N'AVONET internet',                                           N'Měsíční',     664.00,    '2026-09-10', 'bRFq8LcK8vHNGg'),
(N'DATEC', N'BMW 216 7Z88194',                                           N'Měsíční',     11038.00,  '2026-10-08', 'kITdpYOddwUIO7'),
(N'DATEC', N'BMW X1 EL341DZ',                                            N'Měsíční',     18771.92,  '2026-09-28', 'ei8tIA81MX31Tc'),
(N'DATEC', N'BMW X1 EL581CD',                                            N'Měsíční',     15654.79,  '2026-09-20', 'G3mFu8TUPmEUV0'),
(N'DATEC', N'BMW X1 EL761DC',                                            N'Měsíční',     20268.31,  '2026-09-24', 'f2GMohpfnzp3Bs'),
(N'DATEC', N'BMW ŘADA 1 118I',                                           N'Měsíční',     9597.00,   '2026-10-01', 'kYSXukPfRCNUz9'),
(N'DATEC', N'Byt 103',                                                   N'Měsíční',     2107.00,   '2026-09-15', 'VvGE3EK0nMJfC2'),
(N'DATEC', N'Byt 104',                                                   N'Měsíční',     2094.00,   '2026-09-15', 'rNSs8QUuaGM2Nk'),
(N'DATEC', N'Byt 104 prodej',                                            N'Jednorázově', -5100000.00, '2026-09-24', 'K3majisE7VK1ki'),
(N'DATEC', N'Calyx Dell Pro 16',                                         N'Měsíční',     2075.00,   '2026-09-16', 'ail7KKyQikqac2'),
(N'DATEC', N'DPH',                                                       N'Měsíčne',     37000.00,  '2026-09-25', '8N4wasiMOcYveA'),
(N'DATEC', N'E.ON',                                                      N'Měsíční',     1500.00,   '2026-09-15', 'XBXEeJC9Xuo6vA'),
(N'DATEC', N'E.ON',                                                      N'Měsíční',     1090.00,   '2026-09-15', 'dS9ZCYz7dE8nm1'),
(N'DATEC', N'Honza penzijní spoření',                                    N'Měsíční',     4000.00,   '2026-09-15', 'Li1R3f8vDh904Q'),
(N'DATEC', N'Kia Picanto',                                               N'Měsíční',     5691.00,   '2026-09-10', 'Gpby3qsRMKfIoF'),
(N'DATEC', N'KIA PICANTO',                                               N'Měsíční',     5691.00,   '2026-10-07', 'AsBbCtpNgKrlP1'),
(N'DATEC', N'Olin',                                                      N'Měsíční',     1250.00,   '2026-09-10', 'm6tIXNyb5wjCrq'),
(N'DATEC', N'Open AI',                                                   N'Měsíční',     1320.00,   '2026-09-14', 'R1auT9FLDkODPc'),
(N'DATEC', N'OPEN AI - ročně 600 USD',                                   N'roční',       13200.00,  '2027-05-10', 'IHc26c4Jta3vGB'),
(N'DATEC', N'Pojistka BMW 118i 7Z01098',                                 N'Roční',       28509.00,  '2026-11-26', 'Jt2rfh70k5fNPc'),
(N'DATEC', N'Pojistka Honza BMW',                                        N'Jednorázově', 34376.00,  '2026-09-09', 'qiEGbJbpwN4dl9'),
(N'DATEC', N'Pojistné 6Z7 7853 Fabia',                                   N'Roční',       9851.00,   '2026-11-25', 'C80kOVWw7uYE0c'),
(N'DATEC', N'Pojištění Fabia 6Z94244',                                   N'Roční',       12017.00,  '2026-11-14', 'FuRO4CyUwXLRHb'),
(N'DATEC', N'pojištění karavan',                                         N'Roční',       8746.00,   '2026-11-12', 'DvdC9q3ztVscJc'),
(N'DATEC', N'Pojištění majetku a odpovědnosti Allianz (předpis teprve přijde)', N'Roční', 26704.00, '2026-12-04', 'iNmmZ6siYhzzwr'),
(N'DATEC', N'PRE - ZÁLOHY PLYN',                                         N'Měsíční',     8720.00,   '2026-09-13', 'uPipGQjrKKAfhT'),
(N'DATEC', N'ROZHLASOVÝ POPLATEK',                                       N'Čtvrtletní',  1320.00,   '2026-10-15', 'khnCinb08lgMOh'),
(N'DATEC', N'Splatka uveru',                                             N'Měsíčně',     6000.00,   '2026-09-28', 'c5I439fqP3HjIV'),
(N'DATEC', N'SPLÁTKA BMW 116I',                                          N'Měsíční',     7000.00,   '2026-09-22', 'zLCDWOU4m22oOl'),
(N'DATEC', N'SPLÁTKA ÚVĚRU BMW 5',                                       N'Měsíční',     27026.24,  '2026-09-24', 'gtpCHRQPew4CQ8'),
(N'DATEC', N'TELEVIZNÍ POPLATEK',                                        N'Čtvrtletní',  1215.00,   '2026-10-15', 'EJhoYVAikwXt6o'),
(N'DATEC', N'Vodárna zálohy',                                            N'Měsíční',     3390.00,   '2026-09-14', 'GqAZzFHEaRbxlh');
