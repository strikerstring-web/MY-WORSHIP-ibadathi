# Ibadathi — My Worship Companion

<p align="center"><strong>A multilingual companion for organising and tracking everyday acts of worship.</strong></p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white">
</p>

Ibadathi brings prayer tracking, Qur’an progress, fasting logs and dhikr tools together in one place. It is designed to help Muslims organise their worship routines through a simple multilingual web interface.

## Features

- **Prayer tracking:** Record daily prayer status and review prayer history.
- **Prayer times:** Retrieve timings using location coordinates or an entered place, with a calculation-method setting.
- **Prayer reminders:** Configure alerts, sound and vibration where supported by the browser and device.
- **Dhikr counter:** Use built-in remembrance goals and personal dhikr tracking.
- **Qur’an tracker:** Keep a record of reading progress.
- **Fasting tracker:** Record Ramadan and voluntary fasting activity.
- **Qibla finder:** Access the Qibla tool within the app.
- **Personal settings:** Account settings and a dedicated women's section.
- **Languages:** English, Malayalam, Tamil and Arabic.

## Technology

- React 19
- TypeScript
- Vite
- Browser local storage for app data and session persistence
- AlAdhan API for prayer-time data

## Run Locally

**Prerequisite:** Node.js and npm.

1. Clone the repository:
    
        git clone https://github.com/strikerstring-web/MY-WORSHIP-ibadathi.git
        cd MY-WORSHIP-ibadathi

2. Install dependencies:

        npm install

3. Start the development server:

        npm run dev

4. Create a production build:

        npm run build

## Notes

- Prayer-time results depend on location, calculation method, API availability and device permissions.
- Some reminder features depend on browser and device support.
- Account and app data are currently stored in the browser. The project does not provide a production-grade account backend or cloud synchronisation.
- This app is an organisation tool, not a source of religious rulings. Refer fiqh questions to qualified scholars.

## About

Created by **Muhammed Nabeel**.

- GitHub: [@strikerstring-web](https://github.com/strikerstring-web)
- Repository: [MY-WORSHIP-ibadathi](https://github.com/strikerstring-web/MY-WORSHIP-ibadathi)

<p align="center">Made with care for more mindful daily worship.</p>
