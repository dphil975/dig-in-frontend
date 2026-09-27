import React, { useState } from 'react';

const HolidayFrequency = () => {
    const [holiday, setHoliday] = useState({
        name: '',
        month: '',
        day: '',
        year: '',
        weekday: '',
        origin: '',
        numerology: '',
        frequencyMeaning: ''
    });
    const [result, setResult] = useState(null);

    const calculateFrequency = () => {
        const a = parseInt(holiday.month);
        const b = parseInt(holiday.day);
        const year = parseInt(holiday.year);
        const weekday = parseInt(holiday.weekday);

        // c = sqrt(a² + b²)
        const c = Math.sqrt((a ** 2) + (b ** 2));

        // Year modifier
        const yearModifier = (year % 100) / 10;

        // Weekday modifier
        const weekdayModifier = weekday / 7;

        // Origin modifier
        const originModifiers = {
            "Christian": 0.5,
            "Pagan": 1.0,
            "Roman": 0.8,
            "Babylonian": 1.5,
            "Sumerian": 2.0,
            "Mayan": 1.8,
            "Aztec": 1.7,
            "Celtic": 1.2,
            "Slavic": 1.3,
            "Orthodox": 0.6,
            "British": 0.7,
            "French": 0.9,
            "Irish": 1.1
        };
        const originModifier = originModifiers[holiday.origin] || 0.5;

        // Final frequency
        const frequency = (c + yearModifier + weekdayModifier + originModifier).toFixed(2);

        setResult({
            holiday: holiday.name,
            date: `${holiday.month}/${holiday.day}/${holiday.year}`,
            weekday: weekday,
            origin: holiday.origin,
            numerology: holiday.numerology,
            frequencyMeaning: holiday.frequencyMeaning,
            frequency: frequency,
            message: generateMessage(frequency)
        });
    };

    const generateMessage = (freq) => {
        if (freq < 10) return "The energy is low. Ground yourself.";
        if (freq < 20) return "The energy is moderate. Stay centered.";
        if (freq < 30) return "The energy is high. Anchor yourself in love.";
        return "The energy is very high. You are aligned.";
    };

    return (
        <div>
            <h1>Holiday Frequency Calculator</h1>
            <input placeholder="Holiday Name" onChange={(e) => setHoliday({ ...holiday, name: e.target.value })} />
            <input placeholder="Month (1-12)" onChange={(e) => setHoliday({ ...holiday, month: e.target.value })} />
            <input placeholder="Day (1-31)" onChange={(e) => setHoliday({ ...holiday, day: e.target.value })} />
            <input placeholder="Year" onChange={(e) => setHoliday({ ...holiday, year: e.target.value })} />
            <input placeholder="Weekday (1=Monday, 7=Sunday)" onChange={(e) => setHoliday({ ...holiday, weekday: e.target.value })} />
            <input placeholder="Origin (Christian, Pagan, etc.)" onChange={(e) => setHoliday({ ...holiday, origin: e.target.value })} />
            <input placeholder="Numerology (e.g., 2, 7, 3)" onChange={(e) => setHoliday({ ...holiday, numerology: e.target.value })} />
            <input placeholder="Frequency Meaning" onChange={(e) => setHoliday({ ...holiday, frequencyMeaning: e.target.value })} />
            <button onClick={calculateFrequency}>Calculate</button>
            {result && (
                <div>
                    <h2>{result.holiday}</h2>
                    <p>Date: {result.date}</p>
                    <p>Weekday: {result.weekday}</p>
                    <p>Origin: {result.origin}</p>
                    <p>Numerology: {result.numerology}</p>
                    <p>Frequency Meaning: {result.frequencyMeaning}</p>
                    <p>Frequency: {result.frequency}</p>
                    <p>{result.message}</p>
                </div>
            )}
        </div>
    );
};

export default HolidayFrequency;