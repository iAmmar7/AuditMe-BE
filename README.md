# AuditRail
This Application has been made for personal project purpose. Aimed at enhancing operational efficiency and accountability, this application serves as a central hub for auditors, area managers, and administrators to identify, report, and manage faults and issues within the DB application, Deployed on  Vercel.

## Features
- Five types of users; auditor, regional managers, area managers, moderators and an admin.
- Different authorization for different user roles using **express middleware**.
- Different user interface for each type of user according to his/her role.
- Graphical UI for the overall company stats with different filters.
- Initiate or fill issues form as an auditor.
- Feedback form for managers.
- Multiple image upload feature with image optimization on the server.
- Tabular view of all the issues/initiatives/feedback with all sorts of filters.
- Cron job to update the report status.
- Reminder view for station managers.
- Download each report into CSV format.
- Admin panel to add or remove different users.
- Monitor all users' recent activity as an admin.

## Technologies
- React <img align="center" alt="React" src="https://img.shields.io/badge/-React-45b8d8?style=flat-square&logo=react&logoColor=white" />
- Ant Design Pro <img align="center" alt="Antd" src="https://img.shields.io/badge/-Ant%20Design-0170FE?style=flat-square&logo=antdesign&logoColor=white" />
- UmiJS
- Node <img align="center" alt="Nodejs" src="https://img.shields.io/badge/-Nodejs-43853d?style=flat-square&logo=Node.js&logoColor=white" />
- Express <img align="center" alt="Express" src="https://img.shields.io/badge/-Express-000000?style=flat-square&logo=express&logoColor=white" />
- MongoDB <img align="center" alt="MongoDB" src="https://img.shields.io/badge/-MongoDB-13aa52?style=flat-square&logo=mongodb&logoColor=white" />

Backend:
General Features:
- User Roles and Permissions: The application supports multiple user roles, including auditors, regional managers, and an administrator, each with tailored access rights and functionalities.
- User Interface: Customized interfaces for different user roles, enhancing usability and efficiency.
- Graphical UI for Company Stats: Offers visual representation of company-wide audit data, enabling quick insights and decision-making.
- Issue Reporting and Management: Auditors can initiate or fill out detailed issue reports, which managers can review and address accordingly.
- Feedback Mechanism: Enables managers to provide feedback on audits, fostering a continuous improvement environment.
- Evidence Upload: Users can upload multiple images as evidence for reported issues, with server-side optimization for efficient storage and retrieval.
- Data Filtering and Reporting: Features a comprehensive tabular view for tracking and filtering reports, initiatives, and feedback. Also includes the ability to download reports in CSV format for offline analysis.
- Cron Job for Report Status Updates: Automated tasks to regularly update the status of reports, ensuring timely management and closure of issues.
- Reminder System: Notifies station managers about pending tasks, helping maintain accountability and prompt response to issues.
- Admin Panel: Allows the admin to manage user accounts and monitor recent user activities, ensuring operational integrity and compliance.
