// Dig In — MTA transit integration, route-aware store discovery, smart shopping planner

window.DigInRoute = (() => {
    'use strict';

    const SUBWAY = {
        'L': {
            label: 'L Train — Canarsie to 8th Av',
            color: '#a7a9ac',
            stations: [
                { n: '8 Av',                    lat: 40.7424, lng: -74.0019 },
                { n: '6 Av',                    lat: 40.7376, lng: -73.9966 },
                { n: '14 St–Union Sq',          lat: 40.7340, lng: -73.9897 },
                { n: '3 Av',                    lat: 40.7325, lng: -73.9869 },
                { n: '1 Av',                    lat: 40.7305, lng: -73.9815 },
                { n: 'Bedford Av',              lat: 40.7172, lng: -73.9565 },
                { n: 'Lorimer St',              lat: 40.7143, lng: -73.9503 },
                { n: 'Graham Av',               lat: 40.7143, lng: -73.9442 },
                { n: 'Grand St',                lat: 40.7111, lng: -73.9407 },
                { n: 'Montrose Av',             lat: 40.7071, lng: -73.9370 },
                { n: 'Morgan Av',               lat: 40.7066, lng: -73.9310 },
                { n: 'Jefferson St',            lat: 40.7073, lng: -73.9224 },
                { n: 'DeKalb Av',               lat: 40.7031, lng: -73.9183 },
                { n: 'Myrtle–Wyckoff Avs',      lat: 40.6997, lng: -73.9118 },
                { n: 'Halsey St',               lat: 40.6964, lng: -73.9045 },
                { n: 'Wilson Av',               lat: 40.6887, lng: -73.9038 },
                { n: 'Bushwick Av–Aberdeen St', lat: 40.6840, lng: -73.9058 },
                { n: 'Broadway Jct',            lat: 40.6786, lng: -73.9054 },
                { n: 'Atlantic Av',             lat: 40.6754, lng: -73.9071 },
                { n: 'Sutter Av',               lat: 40.6696, lng: -73.9067 },
                { n: 'Livonia Av',              lat: 40.6639, lng: -73.9038 },
                { n: 'New Lots Av',             lat: 40.6583, lng: -73.8994 },
                { n: 'East 105 St',             lat: 40.6509, lng: -73.8958 },
                { n: 'Canarsie–Rockaway Pkwy',  lat: 40.6463, lng: -73.9010 },
            ]
        },
        'A/C/E': {
            label: 'A/C/E — Inwood to Far Rockaway/Jamaica',
            color: '#0039a6',
            stations: [
                { n: '207 St',               lat: 40.8645, lng: -73.9188 },
                { n: '181 St',               lat: 40.8514, lng: -73.9382 },
                { n: '168 St',               lat: 40.8404, lng: -73.9393 },
                { n: '145 St',               lat: 40.8249, lng: -73.9298 },
                { n: '125 St',               lat: 40.8112, lng: -73.9525 },
                { n: '96 St',                lat: 40.7912, lng: -73.9666 },
                { n: '81 St–Museum',         lat: 40.7812, lng: -73.9776 },
                { n: '72 St',                lat: 40.7759, lng: -73.9813 },
                { n: '59 St–Columbus Circle',lat: 40.7681, lng: -73.9819 },
                { n: '42 St–Port Authority', lat: 40.7571, lng: -73.9895 },
                { n: '34 St–Penn Station',   lat: 40.7526, lng: -73.9938 },
                { n: '14 St',                lat: 40.7395, lng: -74.0023 },
                { n: 'W 4 St–Wash Sq',       lat: 40.7324, lng: -74.0001 },
                { n: 'Spring St',            lat: 40.7262, lng: -74.0030 },
                { n: 'Canal St',             lat: 40.7196, lng: -74.0043 },
                { n: 'Fulton St',            lat: 40.7089, lng: -74.0072 },
                { n: 'Jay St–MetroTech',     lat: 40.6923, lng: -73.9866 },
                { n: 'Hoyt–Schermerhorn',    lat: 40.6882, lng: -73.9851 },
                { n: 'Nostrand Av',          lat: 40.6699, lng: -73.9497 },
                { n: 'Utica Av',             lat: 40.6789, lng: -73.9310 },
                { n: 'Ralph Av',             lat: 40.6792, lng: -73.9201 },
                { n: 'Lefferts Blvd',        lat: 40.6853, lng: -73.8747 },
                { n: 'Far Rockaway',         lat: 40.6043, lng: -73.7558 },
                { n: 'Howard Beach',         lat: 40.6601, lng: -73.8305 },
            ]
        },
        '1/2/3': {
            label: '1/2/3 — Van Cortlandt to South Ferry/Flatbush',
            color: '#ee352e',
            stations: [
                { n: 'Van Cortlandt–242 St', lat: 40.8897, lng: -73.8987 },
                { n: '215 St',               lat: 40.8696, lng: -73.9151 },
                { n: '207 St',               lat: 40.8645, lng: -73.9188 },
                { n: '168 St',               lat: 40.8404, lng: -73.9393 },
                { n: '145 St',               lat: 40.8283, lng: -73.9342 },
                { n: '125 St',               lat: 40.8155, lng: -73.9559 },
                { n: '96 St',                lat: 40.7937, lng: -73.9722 },
                { n: '72 St',                lat: 40.7760, lng: -73.9822 },
                { n: '59 St–Columbus Circle',lat: 40.7681, lng: -73.9819 },
                { n: 'Times Sq–42 St',       lat: 40.7557, lng: -73.9878 },
                { n: '34 St–Penn Station',   lat: 40.7505, lng: -73.9912 },
                { n: '14 St',                lat: 40.7376, lng: -73.9961 },
                { n: 'Christopher St',       lat: 40.7332, lng: -74.0027 },
                { n: 'Houston St',           lat: 40.7281, lng: -74.0052 },
                { n: 'Canal St',             lat: 40.7226, lng: -74.0060 },
                { n: 'South Ferry',          lat: 40.7013, lng: -74.0135 },
                { n: 'Borough Hall',         lat: 40.6929, lng: -73.9896 },
                { n: 'Atlantic Av–Barclays', lat: 40.6837, lng: -73.9778 },
                { n: 'Nostrand Av',          lat: 40.6699, lng: -73.9497 },
                { n: 'New Lots Av',          lat: 40.6583, lng: -73.8994 },
                { n: 'Flatbush Av',          lat: 40.6327, lng: -73.9474 },
            ]
        },
        '4/5/6': {
            label: '4/5/6 — Woodlawn/Pelham Bay to Crown Hts/Flatbush',
            color: '#00933c',
            stations: [
                { n: 'Woodlawn',                lat: 40.8861, lng: -73.8783 },
                { n: 'Bedford Park Blvd',       lat: 40.8733, lng: -73.8864 },
                { n: 'Fordham Rd',              lat: 40.8617, lng: -73.8989 },
                { n: 'Pelham Bay Park',         lat: 40.8519, lng: -73.8279 },
                { n: 'Westchester Sq',          lat: 40.8426, lng: -73.8490 },
                { n: '138 St–Grand Concourse',  lat: 40.8131, lng: -73.9267 },
                { n: '125 St',                  lat: 40.8043, lng: -73.9390 },
                { n: '96 St',                   lat: 40.7843, lng: -73.9475 },
                { n: '86 St',                   lat: 40.7780, lng: -73.9560 },
                { n: '68 St–Hunter College',    lat: 40.7684, lng: -73.9643 },
                { n: '59 St',                   lat: 40.7626, lng: -73.9677 },
                { n: 'Grand Central–42 St',     lat: 40.7527, lng: -73.9765 },
                { n: '14 St–Union Sq',          lat: 40.7348, lng: -73.9899 },
                { n: 'Astor Place',             lat: 40.7302, lng: -73.9906 },
                { n: 'Spring St',               lat: 40.7220, lng: -73.9971 },
                { n: 'Brooklyn Bridge',         lat: 40.7134, lng: -74.0040 },
                { n: 'Bowling Green',           lat: 40.7049, lng: -74.0143 },
                { n: 'Borough Hall',            lat: 40.6929, lng: -73.9896 },
                { n: 'Atlantic Av–Barclays',    lat: 40.6837, lng: -73.9778 },
                { n: 'Crown Hts–Utica Av',      lat: 40.6696, lng: -73.9429 },
                { n: 'Flatbush Av',             lat: 40.6327, lng: -73.9474 },
            ]
        },
        'N/Q/R/W': {
            label: 'N/Q/R/W — Astoria to Bay Ridge/Coney Island',
            color: '#fccc0a',
            stations: [
                { n: 'Astoria–Ditmars Blvd',    lat: 40.7757, lng: -73.9119 },
                { n: 'Astoria Blvd',            lat: 40.7710, lng: -73.9301 },
                { n: '30 Av',                   lat: 40.7665, lng: -73.9302 },
                { n: 'Broadway (Queens)',        lat: 40.7618, lng: -73.9299 },
                { n: '36 Av',                   lat: 40.7567, lng: -73.9300 },
                { n: 'Queensboro Plaza',         lat: 40.7501, lng: -73.9404 },
                { n: '5 Av/59 St',              lat: 40.7647, lng: -73.9731 },
                { n: '57 St–7 Av',              lat: 40.7641, lng: -73.9817 },
                { n: 'Times Sq–42 St',          lat: 40.7556, lng: -73.9876 },
                { n: '34 St–Herald Sq',         lat: 40.7493, lng: -73.9880 },
                { n: '14 St',                   lat: 40.7378, lng: -73.9979 },
                { n: '8 St–NYU',                lat: 40.7302, lng: -73.9930 },
                { n: 'Prince St',               lat: 40.7244, lng: -73.9972 },
                { n: 'Canal St',                lat: 40.7194, lng: -74.0001 },
                { n: 'City Hall',               lat: 40.7131, lng: -74.0079 },
                { n: 'Jay St–MetroTech',        lat: 40.6923, lng: -73.9866 },
                { n: 'Atlantic Av–Barclays',    lat: 40.6837, lng: -73.9778 },
                { n: '4 Av–9 St',               lat: 40.6703, lng: -73.9885 },
                { n: '25 St',                   lat: 40.6601, lng: -73.9988 },
                { n: '36 St',                   lat: 40.6550, lng: -74.0031 },
                { n: '59 St',                   lat: 40.6408, lng: -74.0178 },
                { n: 'Bay Ridge Av',            lat: 40.6349, lng: -74.0223 },
                { n: '86 St',                   lat: 40.6232, lng: -74.0302 },
                { n: 'Bay Ridge–95 St',         lat: 40.6161, lng: -74.0347 },
                { n: 'Coney Island–Stillwell',  lat: 40.5778, lng: -73.9812 },
                { n: 'Brighton Beach',          lat: 40.5776, lng: -73.9612 },
                { n: 'Sheepshead Bay',          lat: 40.5860, lng: -73.9543 },
                { n: 'Flatbush Av',             lat: 40.6327, lng: -73.9474 },
            ]
        },
        '7': {
            label: '7 — Flushing–Main St to Hudson Yards',
            color: '#b933ad',
            stations: [
                { n: 'Flushing–Main St',        lat: 40.7596, lng: -73.8300 },
                { n: 'Mets–Willets Point',      lat: 40.7541, lng: -73.8457 },
                { n: 'Junction Blvd',           lat: 40.7491, lng: -73.8694 },
                { n: '90 St–Elmhurst Av',       lat: 40.7487, lng: -73.8765 },
                { n: '82 St–Jackson Heights',   lat: 40.7486, lng: -73.8834 },
                { n: '74 St–Broadway',          lat: 40.7486, lng: -73.8918 },
                { n: 'Roosevelt Av–Jackson Hts',lat: 40.7484, lng: -73.8992 },
                { n: '61 St–Woodside',          lat: 40.7480, lng: -73.9172 },
                { n: '52 St',                   lat: 40.7478, lng: -73.9267 },
                { n: '46 St–Bliss St',          lat: 40.7477, lng: -73.9340 },
                { n: '40 St–Lowery St',         lat: 40.7476, lng: -73.9423 },
                { n: 'Court Sq–23 St',          lat: 40.7476, lng: -73.9451 },
                { n: 'Vernon Blvd–Jackson Av',  lat: 40.7444, lng: -73.9535 },
                { n: 'Grand Central–42 St',     lat: 40.7527, lng: -73.9765 },
                { n: 'Times Sq–42 St',          lat: 40.7557, lng: -73.9878 },
                { n: '34 St–Hudson Yards',      lat: 40.7549, lng: -74.0015 },
            ]
        },
        'B/D/F/M': {
            label: 'B/D/F/M — Bronx/Jamaica to Coney Island',
            color: '#ff6319',
            stations: [
                { n: 'Bedford Pk Blvd (Bronx)',  lat: 40.8733, lng: -73.8864 },
                { n: 'Fordham Rd (Bronx)',       lat: 40.8617, lng: -73.8989 },
                { n: 'Forest Hills–71 Av',       lat: 40.7214, lng: -73.8447 },
                { n: '75 Av',                    lat: 40.7180, lng: -73.8440 },
                { n: 'Jackson Heights',          lat: 40.7461, lng: -73.8914 },
                { n: 'Lexington Av/63 St',       lat: 40.7618, lng: -73.9671 },
                { n: '57 St',                    lat: 40.7635, lng: -73.9770 },
                { n: '47–50 Sts–Rock Ctr',       lat: 40.7584, lng: -73.9820 },
                { n: '42 St–Bryant Park',        lat: 40.7543, lng: -73.9842 },
                { n: '34 St–Herald Sq',          lat: 40.7493, lng: -73.9880 },
                { n: '14 St',                    lat: 40.7378, lng: -73.9979 },
                { n: 'W 4 St–Wash Sq',           lat: 40.7324, lng: -74.0001 },
                { n: 'Broadway–Lafayette',       lat: 40.7256, lng: -73.9960 },
                { n: 'Grand St',                 lat: 40.7166, lng: -73.9934 },
                { n: 'York St',                  lat: 40.7015, lng: -73.9866 },
                { n: 'Jay St–MetroTech',         lat: 40.6923, lng: -73.9866 },
                { n: '7 Av (Brooklyn)',          lat: 40.6777, lng: -73.9726 },
                { n: '15 St–Prospect Park',      lat: 40.6608, lng: -73.9795 },
                { n: 'Church Av',                lat: 40.6508, lng: -73.9797 },
                { n: '18 Av',                    lat: 40.6403, lng: -73.9801 },
                { n: 'Bay Pkwy',                 lat: 40.6219, lng: -73.9843 },
                { n: 'Coney Island–Stillwell',   lat: 40.5778, lng: -73.9812 },
            ]
        },
        'G': {
            label: 'G — Court Sq to Church Av',
            color: '#6cbe45',
            stations: [
                { n: 'Court Sq',               lat: 40.7476, lng: -73.9451 },
                { n: '21 St',                  lat: 40.7441, lng: -73.9496 },
                { n: 'Greenpoint Av',          lat: 40.7305, lng: -73.9545 },
                { n: 'Nassau Av',              lat: 40.7245, lng: -73.9512 },
                { n: 'Metropolitan Av',        lat: 40.7143, lng: -73.9513 },
                { n: 'Broadway (Brooklyn)',    lat: 40.7063, lng: -73.9502 },
                { n: 'Flushing Av',            lat: 40.7003, lng: -73.9506 },
                { n: 'Myrtle–Willoughby Avs', lat: 40.6948, lng: -73.9493 },
                { n: 'Bedford–Nostrand Avs',   lat: 40.6895, lng: -73.9534 },
                { n: 'Classon Av',             lat: 40.6888, lng: -73.9606 },
                { n: 'Clinton–Washington Avs', lat: 40.6880, lng: -73.9688 },
                { n: 'Fulton St',              lat: 40.6869, lng: -73.9752 },
                { n: 'Hoyt–Schermerhorn',      lat: 40.6882, lng: -73.9851 },
                { n: 'Carroll St',             lat: 40.6807, lng: -73.9951 },
                { n: 'Smith–9 Sts',            lat: 40.6736, lng: -73.9961 },
                { n: '4 Av–9 St',              lat: 40.6703, lng: -73.9885 },
                { n: '15 St–Prospect Park',    lat: 40.6608, lng: -73.9795 },
                { n: 'Fort Hamilton Pkwy',     lat: 40.6508, lng: -73.9754 },
                { n: 'Church Av',              lat: 40.6508, lng: -73.9797 },
            ]
        },
        'J/M/Z': {
            label: 'J/M/Z — Jamaica to Broad St',
            color: '#996633',
            stations: [
                { n: 'Jamaica Center',     lat: 40.7025, lng: -73.8014 },
                { n: 'Sutphin Blvd',       lat: 40.7001, lng: -73.8086 },
                { n: '121 St',             lat: 40.7002, lng: -73.8235 },
                { n: '104 St',             lat: 40.6999, lng: -73.8410 },
                { n: '88 St',              lat: 40.6929, lng: -73.8603 },
                { n: 'Woodhaven Blvd',     lat: 40.6841, lng: -73.8589 },
                { n: 'Cypress Hills',      lat: 40.6901, lng: -73.8790 },
                { n: 'Norwood Av',         lat: 40.6819, lng: -73.8938 },
                { n: 'Van Siclen Av',      lat: 40.6791, lng: -73.9045 },
                { n: 'Broadway Jct',       lat: 40.6786, lng: -73.9054 },
                { n: 'Halsey St',          lat: 40.6857, lng: -73.9176 },
                { n: 'Kosciuszko St',      lat: 40.6929, lng: -73.9291 },
                { n: 'Myrtle Av',          lat: 40.6974, lng: -73.9364 },
                { n: 'Flushing Av',        lat: 40.7003, lng: -73.9455 },
                { n: 'Lorimer St',         lat: 40.7037, lng: -73.9474 },
                { n: 'Marcy Av',           lat: 40.7083, lng: -73.9561 },
                { n: 'Delancey–Essex St',  lat: 40.7191, lng: -73.9883 },
                { n: 'Canal St',           lat: 40.7188, lng: -74.0001 },
                { n: 'Chambers St',        lat: 40.7134, lng: -74.0085 },
                { n: 'Fulton St',          lat: 40.7089, lng: -74.0072 },
                { n: 'Broad St',           lat: 40.7059, lng: -74.0114 },
            ]
        },
    };

    const BUSES = {
        'M15': {
            label: 'M15 — 1st/2nd Av (Manhattan)',
            color: '#e53935',
            stations: [
                { n: 'E 125 St/2 Av',     lat: 40.8043, lng: -73.9390 },
                { n: 'E 116 St/2 Av',     lat: 40.7975, lng: -73.9378 },
                { n: 'E 96 St/2 Av',      lat: 40.7843, lng: -73.9475 },
                { n: 'E 86 St/2 Av',      lat: 40.7778, lng: -73.9516 },
                { n: 'E 72 St/2 Av',      lat: 40.7691, lng: -73.9564 },
                { n: 'E 57 St/2 Av',      lat: 40.7573, lng: -73.9659 },
                { n: 'E 42 St/2 Av',      lat: 40.7515, lng: -73.9710 },
                { n: 'E 34 St/2 Av',      lat: 40.7456, lng: -73.9748 },
                { n: 'E 23 St/1 Av',      lat: 40.7402, lng: -73.9776 },
                { n: 'E 14 St/1 Av',      lat: 40.7325, lng: -73.9823 },
                { n: 'Delancey St/1 Av',  lat: 40.7189, lng: -73.9838 },
            ]
        },
        'M86-SBS': {
            label: 'M86 SBS — 86th St crosstown',
            color: '#1565c0',
            stations: [
                { n: 'W 86 St/Riverside Dr',  lat: 40.7864, lng: -73.9834 },
                { n: 'W 86 St/Broadway',       lat: 40.7863, lng: -73.9810 },
                { n: 'W 86 St/Amsterdam Av',   lat: 40.7856, lng: -73.9739 },
                { n: 'W 86 St/Columbus Av',    lat: 40.7858, lng: -73.9700 },
                { n: 'E 86 St/5 Av',           lat: 40.7789, lng: -73.9608 },
                { n: 'E 86 St/Lexington Av',   lat: 40.7783, lng: -73.9540 },
                { n: 'E 86 St/3 Av',           lat: 40.7778, lng: -73.9516 },
                { n: 'E 86 St/1 Av',           lat: 40.7769, lng: -73.9480 },
            ]
        },
        'B41': {
            label: 'B41 — Flatbush Av (Brooklyn)',
            color: '#00796b',
            stations: [
                { n: 'Flatbush/Atlantic Av',   lat: 40.6836, lng: -73.9777 },
                { n: 'Flatbush/Bergen St',     lat: 40.6801, lng: -73.9734 },
                { n: 'Flatbush/Empire Blvd',   lat: 40.6583, lng: -73.9560 },
                { n: 'Flatbush/Church Av',     lat: 40.6498, lng: -73.9546 },
                { n: 'Flatbush/Cortelyou Rd',  lat: 40.6400, lng: -73.9519 },
                { n: 'Flatbush/Newkirk Av',    lat: 40.6295, lng: -73.9489 },
                { n: 'Flatbush/Nostrand Av',   lat: 40.6205, lng: -73.9470 },
            ]
        },
        'B44-SBS': {
            label: 'B44 SBS — Nostrand Av (Brooklyn)',
            color: '#4caf50',
            stations: [
                { n: 'Nostrand/Atlantic Av',   lat: 40.6866, lng: -73.9505 },
                { n: 'Nostrand/Fulton St',     lat: 40.6820, lng: -73.9496 },
                { n: 'Nostrand/Eastern Pkwy',  lat: 40.6700, lng: -73.9497 },
                { n: 'Nostrand/Church Av',     lat: 40.6503, lng: -73.9497 },
                { n: 'Nostrand/Av H',          lat: 40.6251, lng: -73.9469 },
                { n: 'Flatbush/Av U',          lat: 40.5980, lng: -73.9413 },
            ]
        },
        'Bx12-SBS': {
            label: 'Bx12 SBS — Fordham Rd (Bronx)',
            color: '#c62828',
            stations: [
                { n: 'Fordham/University Av',   lat: 40.8600, lng: -73.9060 },
                { n: 'Fordham/Webster Av',      lat: 40.8600, lng: -73.8910 },
                { n: 'Fordham/Park Av',         lat: 40.8597, lng: -73.8850 },
                { n: 'Fordham/Third Av',        lat: 40.8596, lng: -73.8820 },
                { n: 'Fordham/Southern Blvd',   lat: 40.8585, lng: -73.8785 },
                { n: 'Fordham/Pelham Pkwy',     lat: 40.8583, lng: -73.8660 },
                { n: 'Fordham/Eastchester Rd',  lat: 40.8582, lng: -73.8560 },
            ]
        },
        'Q58': {
            label: 'Q58 — Ridgewood to Flushing',
            color: '#7b1fa2',
            stations: [
                { n: 'Flushing/Main St',          lat: 40.7592, lng: -73.8300 },
                { n: 'Fresh Meadows',             lat: 40.7368, lng: -73.7869 },
                { n: 'Jamaica Av/Woodhaven Blvd', lat: 40.6963, lng: -73.8560 },
                { n: 'Myrtle Av/Wyckoff',         lat: 40.6994, lng: -73.9119 },
            ]
        },
        'S79-SBS': {
            label: 'S79 SBS — St George to Charleston',
            color: '#37474f',
            stations: [
                { n: 'St George/Bay St',         lat: 40.6439, lng: -74.0732 },
                { n: 'Richmond Ter/Broadway',    lat: 40.6370, lng: -74.0805 },
                { n: 'Richmond Av/Forest Av',    lat: 40.6262, lng: -74.1180 },
                { n: 'Victory Blvd/Richmond Av', lat: 40.6050, lng: -74.1505 },
                { n: 'Arthur Kill Rd',           lat: 40.5756, lng: -74.1700 },
            ]
        },
    };

    const PRICE_TIERS = [
        { tier: 1, label: '$',   kw: ['aldi', 'lidl', 'dollar', 'compare', 'bravo', 'ctown', 'c-town', 'key food', 'met food', 'fine fare', 'western beef', 'extra supermarket'] },
        { tier: 3, label: '$$$', kw: ['whole foods', 'trader joe', 'fairway', 'citarella', "zabar", 'dean & deluca'] },
    ];

    const INGREDIENT_CATS = [
        { cat: 'produce',   words: ['apple','banana','tomato','potato','onion','garlic','lettuce','spinach','carrot','pepper','cucumber','avocado','broccoli','celery','mushroom','kale','herb','lemon','lime','orange','berry'] },
        { cat: 'dairy',     words: ['milk','cheese','butter','cream','yogurt','egg','sour cream','cream cheese','mozzarella','parmesan'] },
        { cat: 'meat/fish', words: ['chicken','beef','pork','fish','salmon','shrimp','turkey','lamb','tilapia','steak','cod'] },
        { cat: 'pantry',    words: ['rice','pasta','flour','sugar','oil','vinegar','sauce','broth','can','bean','lentil','cereal','oat','bread','cracker','tortilla','noodle'] },
        { cat: 'snacks',    words: ['chip','cookie','granola','nut','chocolate','candy'] },
        { cat: 'beverages', words: ['water','juice','soda','tea','coffee','wine','beer'] },
    ];

    function dist(lat1, lng1, lat2, lng2) {
        const R = 3958.8;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function storePriceTier(name) {
        const lc = name.toLowerCase();
        for (const t of PRICE_TIERS) {
            if (t.kw.some(k => lc.includes(k))) return t;
        }
        return { tier: 2, label: '$$' };
    }

    function categoriseIngredient(text) {
        const lc = text.toLowerCase();
        for (const { words, cat } of INGREDIENT_CATS) {
            if (words.some(w => lc.includes(w))) return cat;
        }
        return 'pantry';
    }

    function getStoresOnLine(lineKey, allMarkers, radiusMi = 0.3) {
        const line = SUBWAY[lineKey] || BUSES[lineKey];
        if (!line) return [];
        const stops = line.stations || [];
        const seen = new Set();
        const results = [];
        stops.forEach((stop, stopIdx) => {
            allMarkers.forEach(m => {
                if (!m.lat || !m.lng || !m.name) return;
                const d = dist(stop.lat, stop.lng, m.lat, m.lng);
                if (d <= radiusMi && !seen.has(m.name)) {
                    seen.add(m.name);
                    results.push({ ...m, stopName: stop.n, stopIndex: stopIdx, distToStop: d, priceTier: storePriceTier(m.name) });
                }
            });
        });
        return results.sort((a, b) => a.stopIndex - b.stopIndex);
    }

    function planShopping(items, routeStores) {
        if (!items.length || !routeStores.length) return [];
        const plan = items.map(item => {
            const cat = categoriseIngredient(item);
            let best = null, bestScore = Infinity;
            routeStores.forEach(store => {
                let score = (store.priceTier.tier || 2) * 10 + store.stopIndex * 0.1;
                if (['produce','dairy','meat/fish'].includes(cat) && store.type === 'grocery') score -= 5;
                if (['snacks','beverages'].includes(cat) && store.type === 'bodega') score -= 2;
                if (score < bestScore) { bestScore = score; best = store; }
            });
            return { item, store: best };
        });
        const grouped = new Map();
        plan.forEach(({ item, store }) => {
            if (!store) return;
            if (!grouped.has(store.name)) grouped.set(store.name, { store, items: [] });
            grouped.get(store.name).items.push(item);
        });
        return [...grouped.values()].sort((a, b) => (a.store.stopIndex || 0) - (b.store.stopIndex || 0));
    }

    async function geocodeAddress(address) {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', New York')}&format=json&limit=1`;
        const res = await fetch(url, { headers: { 'User-Agent': 'DigInApp/1.0' } });
        const data = await res.json();
        if (!data.length) throw new Error('Address not found');
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
    }

    // Perpendicular distance from point P to segment A→B, in miles
    function pointToSegDist(pLat, pLng, aLat, aLng, bLat, bLng) {
        const dx = bLng - aLng, dy = bLat - aLat;
        if (dx === 0 && dy === 0) return dist(pLat, pLng, aLat, aLng);
        const t = Math.max(0, Math.min(1,
            ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)
        ));
        return dist(pLat, pLng, aLat + t * dy, aLng + t * dx);
    }

    // Returns stores within corridorMiles of the straight line from home→work,
    // sorted by how far along the route they sit (closest to home first).
    function getStoresAlongPath(homeLat, homeLng, workLat, workLng, allMarkers, corridorMiles = 0.4) {
        const dx = workLng - homeLng, dy = workLat - homeLat;
        const pathLen = dist(homeLat, homeLng, workLat, workLng);
        const results = [];

        allMarkers.forEach(m => {
            if (!m.lat || !m.lng || !m.name) return;
            const d = pointToSegDist(m.lat, m.lng, homeLat, homeLng, workLat, workLng);
            if (d > corridorMiles) return;
            // Project onto path axis to get position along route
            const denom = dx * dx + dy * dy;
            const t = denom ? Math.max(0, Math.min(1, ((m.lng - homeLng) * dx + (m.lat - homeLat) * dy) / denom)) : 0;
            results.push({
                ...m,
                distToPath:   d,
                distFromHome: pathLen * t,
                priceTier:    storePriceTier(m.name),
            });
        });

        return results.sort((a, b) => a.distFromHome - b.distFromHome);
    }

    return { SUBWAY, BUSES, dist, storePriceTier, categoriseIngredient, getStoresOnLine, getStoresAlongPath, planShopping, geocodeAddress };
})();
