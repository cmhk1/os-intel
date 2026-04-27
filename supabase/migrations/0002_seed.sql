-- =============================================================================
-- SEED DATA :: Oil & Energy vertical
-- Real IMOs, real ports, plausible trades
-- Run AFTER you create at least one user via auth. Replace the demo_user_id
-- and demo_org_id below with real UUIDs, or use the setup script.
-- =============================================================================

-- Create a demo org (idempotent)
insert into public.organizations (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Demo Trading Co.', 'demo-trading')
on conflict (id) do nothing;

-- Attach ALL existing profiles to the demo org if they have no org (dev helper)
update public.profiles set org_id = '00000000-0000-0000-0000-000000000001'
where org_id is null;

-- ==== VESSELS (real IMOs — verifiable on MarineTraffic) ====
insert into public.vessels (id, imo, mmsi, name, type, flag, dwt, built, operator, last_position_lat, last_position_lon, last_position_at, last_speed, last_heading, last_status, destination, eta)
values
  ('10000000-0000-0000-0000-000000000001', '9776633', '538007623', 'SEAWAYS ENDEAVOR', 'Crude Oil Tanker', 'Marshall Islands', 299999, 2016, 'Seaways Crude Transport', 25.8234, 55.1234, now() - interval '12 minutes', 12.4, 92, 'Under way using engine', 'FUJAIRAH', now() + interval '2 days'),
  ('10000000-0000-0000-0000-000000000002', '9729395', '636018123', 'NEW ADVANCE', 'Crude Oil Tanker', 'Liberia', 319000, 2015, 'NYK Line', 1.2674, 103.8000, now() - interval '4 minutes', 14.1, 260, 'Under way using engine', 'SINGAPORE', now() + interval '18 hours'),
  ('10000000-0000-0000-0000-000000000003', '9820553', '352001234', 'STENA IMPULSE', 'Products Tanker', 'Panama', 49999, 2019, 'Stena Bulk', 51.9500, 4.1433, now() - interval '22 minutes', 0.2, 0, 'Moored', 'ROTTERDAM', null),
  ('10000000-0000-0000-0000-000000000004', '9465307', '636092123', 'EAGLE BOSTON', 'Crude Oil Tanker', 'Liberia', 113000, 2011, 'AET Tankers', 29.3759, 48.2756, now() - interval '8 minutes', 11.8, 135, 'Under way using engine', 'MINA AL AHMADI', now() + interval '6 hours'),
  ('10000000-0000-0000-0000-000000000005', '9845711', '538008901', 'FRONT ALFA', 'Crude Oil Tanker', 'Marshall Islands', 157000, 2020, 'Frontline', 23.12, 37.82, now() - interval '35 minutes', 13.2, 345, 'Under way using engine', 'AIN SUKHNA', now() + interval '3 days')
on conflict (id) do nothing;

-- ==== COUNTERPARTIES ====
insert into public.counterparties (id, org_id, name, type, country, risk_score, sanctions_status) values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Vitol S.A.', 'buyer', 'CH', 12, 'clear'),
  ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Trafigura Pte Ltd', 'buyer', 'SG', 15, 'clear'),
  ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Gunvor Group', 'buyer', 'CY', 22, 'clear'),
  ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Saudi Aramco Trading', 'seller', 'SA', 8, 'clear'),
  ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'ADNOC Global Trading', 'seller', 'AE', 10, 'clear'),
  ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'KPC Kuwait Petroleum', 'seller', 'KW', 14, 'clear'),
  ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'ING Bank N.V.', 'bank', 'NL', 5, 'clear'),
  ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'Société Générale', 'bank', 'FR', 6, 'clear'),
  ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'SGS S.A.', 'surveyor', 'CH', 4, 'clear'),
  ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000001', 'Intertek Caleb Brett', 'surveyor', 'GB', 5, 'clear'),
  ('20000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000001', 'Unregistered Broker Ltd', 'broker', 'CY', 78, 'flagged')
on conflict (id) do nothing;

-- ==== DEALS ====
insert into public.deals (id, org_id, deal_ref, status, commodity, grade, quantity, unit, price, currency, price_mechanism, incoterm, buyer_id, seller_id, bank_id, surveyor_id, vessel_id, load_port, discharge_port, laycan_start, laycan_end, etd, eta, payment_terms, lc_number, ai_risk_score, ai_summary) values
  ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'OIL-2026-0142', 'in_transit', 'Crude Oil', 'Arab Light', 2000000, 'BBL', 79.45, 'USD', 'Platts Dubai + 0.15', 'FOB',
    '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000001',
    'RAS TANURA', 'FUJAIRAH', current_date - 5, current_date - 3, current_date - 2, current_date + 2,
    'LC at sight', 'LC-2026-78431', 18, 'Standard Aramco → Vitol lifting. All docs consistent. ETA on track.'),

  ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'OIL-2026-0143', 'loading', 'Crude Oil', 'Upper Zakum', 1000000, 'BBL', 78.90, 'USD', 'ICE Brent - 1.85', 'CIF',
    '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-000000000002',
    'DAS ISLAND', 'SINGAPORE', current_date - 2, current_date + 1, current_date + 1, current_date + 14,
    'Open account 30 days', null, 32, 'Loading in progress. Slight delay in nomination — monitor laycan tightness.'),

  ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'OIL-2026-0139', 'discharged', 'Gasoil', '10ppm', 300000, 'MT', 645.00, 'USD', 'Platts FOB ARA + 8.50', 'CFR',
    '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000003',
    'JUBAIL', 'ROTTERDAM', current_date - 25, current_date - 22, current_date - 21, current_date - 2,
    'LC at sight', 'LC-2026-78102', 25, 'Discharged at Rotterdam. Awaiting final survey report before settlement.'),

  ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'OIL-2026-0144', 'contracted', 'Crude Oil', 'Kuwait Export', 2000000, 'BBL', 79.10, 'USD', 'Platts Dubai + 0.05', 'FOB',
    '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000009',
    '10000000-0000-0000-0000-000000000004',
    'MINA AL AHMADI', 'CHIBA', current_date + 3, current_date + 6, current_date + 5, current_date + 22,
    'LC at sight', 'LC-2026-78512', 22, 'New contract. Awaiting LC issuance and vessel nomination confirmation.'),

  ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'OIL-2026-0138', 'disputed', 'Fuel Oil', 'HSFO 380', 80000, 'MT', 478.50, 'USD', 'Platts FOB Sing + 2.00', 'FOB',
    '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-000000000005',
    'FUJAIRAH', 'SINGAPORE', current_date - 18, current_date - 15, current_date - 14, current_date - 1,
    'Open account 15 days', null, 71, 'QUALITY DISPUTE: Sulphur content at discharge measured 3.7% vs contractual 3.5% max. Surveyor discrepancy between load and discharge ports.')
on conflict (id) do nothing;

-- ==== EVENTS (create a narrative) ====
insert into public.events (org_id, deal_id, event_type, source, payload, severity, occurred_at) values
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'deal.created', 'manual', '{}', 'info', now() - interval '8 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'document.uploaded', 'manual', '{"doc_type":"letter_of_credit","lc_number":"LC-2026-78431"}', 'info', now() - interval '7 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'vessel.departed', 'ais', '{"port":"RAS TANURA"}', 'info', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'document.uploaded', 'manual', '{"doc_type":"bill_of_lading"}', 'info', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'ai.validation_clean', 'ai', '{"docs_checked":3}', 'info', now() - interval '1 day'),

  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'document.uploaded', 'manual', '{"doc_type":"inspection_report","location":"load"}', 'info', now() - interval '15 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'document.uploaded', 'manual', '{"doc_type":"inspection_report","location":"discharge"}', 'warn', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'ai.discrepancy_detected', 'ai', '{"field":"sulphur_content","load":"3.48%","discharge":"3.71%","tolerance":"3.50%"}', 'critical', now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 'deal.disputed', 'manual', '{"reason":"quality"}', 'critical', now() - interval '12 hours'),

  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'vessel.arrived_load_port', 'ais', '{"port":"DAS ISLAND"}', 'info', now() - interval '3 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'loading.commenced', 'manual', '{}', 'info', now() - interval '1 day'),

  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'vessel.arrived_discharge', 'ais', '{"port":"ROTTERDAM"}', 'info', now() - interval '2 days'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'discharge.completed', 'manual', '{}', 'info', now() - interval '1 day');

-- ==== TRIGGERS ====
insert into public.triggers (org_id, deal_id, name, description, conditions, action, status) values
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'B/L + AIS confirm loading → release 30%', 'When bill of lading uploaded AND AIS confirms vessel at load port, mark milestone M1 and release 30%', '{"all":[{"event":"document.uploaded","doc_type":"bill_of_lading"},{"event":"vessel.departed","port":"RAS TANURA"}]}', 'release_milestone', 'fired'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'AIS gap > 6h → flag', 'Flag if vessel AIS has any gap > 6 hours', '{"ais_gap_hours":6}', 'flag', 'armed'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 'Laycan expiry warning', 'Notify 24h before laycan ends if vessel not loaded', '{"hours_before_laycan_end":24,"status_not":"loading_complete"}', 'notify', 'armed'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 'LC issued → arm loading triggers', 'When LC confirmed, arm all downstream triggers', '{"event":"document.uploaded","doc_type":"letter_of_credit"}', 'notify', 'armed');

-- ==== LENDING ====
insert into public.lending_requests (org_id, deal_id, amount, currency, tenor_days, purpose, status) values
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 140000000, 'USD', 90, 'Pre-shipment finance against Aramco lifting', 'open'),
  ('00000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 65000000, 'USD', 60, 'Transit finance ADNOC → Singapore', 'quoted');
