# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - 22.03.2026 to 29.03.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 27.03.26   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/8aec5d780a5e82506b3021240975bec44125daa8 | Add Event + Creation Form | Start of the begining of the collaboration task of the project|
|                    | 27.03.26   | (https://github.com/claudioo2/sopra-fs26-group-21-client/commit/6c558b88c3a6bff18d8c958241a3bf8c8cca2493) | actualisation of the ReadMe Files for the back and front end | Nice to have a good organisation |
| **fra-a11y** | [29.03.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/dfaeeef0b9a34c6dfe3844eb84ca7b57213afbc0#diff-562367831912b009c4b6f4ede8ef3cd641a0a3246e77ebb7da411b6162591de4] | [Asking the user to allow the geolocation, to center the map based on his location] | [The MAP use to land on the city of Berlin, making it difficult to navigate through local events] |
|                    | [29.03.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/adac2aba3802be7ca451c51c94abd40c983d4d38] | [Adjusting map size and polishing marker looks ] | [The map was covering only half of the screen, and the marker where not meeting the UI expectations] |
| **Pascal-Trautmann** | [28.03.2026]   | [[Link to Commit 1](https://github.com/claudioo2/sopra-fs26-group-21-server/pull/79/changes/d29668b4f9cd1e8bafbb1df3c5dc814559f52672)] | [Made it so that creator is added as participant] | [So creator can access the event info] |
| **Pascal-Trautmann** | [29.03.2026]   | [[Link to Commit 1][([https://github.com/claudioo2/sopra-fs26-group-21-server/pull/79/changes/d29668b4f9cd1e8bafbb1df3c5dc814559f52672)](https://github.com/claudioo2/sopra-fs26-group-21-client/commit/cb195318c115d751eedd3c4c26b9fa54c9caa892)]](https://github.com/claudioo2/sopra-fs26-group-21-server/pull/79/changes/d29668b4f9cd1e8bafbb1df3c5dc814559f52672) | [Made it so toggle of private vs public works] | [So creator can choose to toggle the events publicity] |
|**claudioo2**| [29.03.2026]  | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/eafad4641dcb6546cbc4216a44781971b96776fc | Set-up of API and implementation of map| The use of the map to find events is a core concept of the project. Also includes a trial with the google maps API |
| **semirIbra** | [29.03.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-server/commit/8dabf192ea92a41c237ca41045f1620373505b8b] | [The task was to implement in the server the logic not to show past events on the map. E.g. if I am on the map then I don't want to see an event that ended yeseterday.] | [This is essential for the map interface because if our user is on the map then there should be no past event visible. Furthermore the implementation also makes it possible that only events are shown in the map where the user is currently looking at.] |
|                    | [29.03.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/7245c76d315ae30b0521824bb2f6b21090fd5619] | [Update the map with events that are present in the area where the user zooms/pans] | [If the user pans/zooms to a different area then the events in that area should be visible. Otherwise it would be a bad user experience if there would be no events showing up eventhough they exist] |


---

## Contributions Week 2 - 30.03.2026 to 12.04.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 03.04.2026  | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/6fde28c313c8192434da28bc8321710ed3d66d1a | Upon successful creation, the event is saved to the database and the pointer immediately appears on the map for all users | important for the overview and for the database format |
|                    | 09.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/78db24dc4cf8a46b3d9c50c18cebef4af07aa453 | view event details on marker click with creator, participants and pictures | one important features of the frontend|
| **fra-a11y** | 10.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/f14ada4463843ec65387258d6af035e6a1fb8bf8 | Private events are saved to the database but are never fetched or displayed on the map for non-participants. Backend filters events in getEventsInRadius — public events show to everyone, private events show only to participants (S4 Category: Event Management) | When someone creates a private event, it should only be visible on the map to people who were invited/joined |
|                    | 12.04.2026   | client: https://github.com/claudioo2/sopra-fs26-group-21-client/commit/0d0a6f29c040d774dffb917ffdb80ba0a52800c1   server: https://github.com/claudioo2/sopra-fs26-group-21-server/commit/707062d32a791e57f635c021836ad573e8f2e884 | Implement post-join redirect to event group chat interface (S6 acceptance criterion) | After a user joins an event, they must be immediately given access to the group chat for that event. Without this redirect, the join action has no clear outcome |
| **Pascal-Trautmann** | [12.04.2026]   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/b8bf731ef75324f2cd309fc61b7f403754b0c4c6 | [Added REST endpoint to fetch all messages of an event (history)] | [The contribution supports user story #55 in backend, it states that: Upon opening the chat, previous messages associated with that event are fetched from the database and displayed, which is important for the chat to be useful to the user] |
|                    | [12.04.2026]   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/ad417404c49c4523e69bc6bc89e4bdd1a6d836e7 | [Added a method to message repository that fetches all messages of an event ordered by timestamps] | [It is the backend part that supports issue #57, it is essential that a user can see who sent which message and gets them in a useful/logical order] |
| **claudioo2** | 12.04.2026   | [https://github.com/claudioo2/sopra-fs26-group-21-server/commit/5ed0d749029b98ced875467a777ee8f3b7e7cc82] | [Logic to check if a user is a participant in an event] | [Checking the participation of a user in an event is essential to allow the rest of the functions] |
|                    | 12.04.2026    | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/f0660f16268f3cc3880e7341787c8a0c98570d5e | [Front end interface for joining/leaving events/chat]| [A user must be able to find and join events, as well as leave events they joined] |
| **semirIbra** | [09.04.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/fb80b99c3a27b88a492710c792f810ca917353b2, (backend part: https://github.com/claudioo2/sopra-fs26-group-21-server/commit/bbd8505fcd3b66cbac95c9a13aea147d0703f661)] | [Upon creation, the creator of an event should receive a unique, shareable code to invite others (which is found when clicking on the event). This code is only visible to the creator of the event and not to non-creators] | [This code is later used for users that are not creators of an event and they should be able to join with that code. This is especially relevant to private events that cannot be found on the map because they require this code from the event creator to join private events (so that people that do not have that code cannot join)] |
|                    | [10.04.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-server/commit/1383d53ffb2879b1f919d77c362224ba5ac8a539] | [Make the backend work for the client such that when a user joins successfully an event it adds the event's participant list in the database adds the user. To make this work, a RESTApi needs to be implemented for this functionality.] | [This is relevant later for the client repo to make the join functionality work. The RESTApi can be used to do a join request when users want to participate in an event] |

---

## Contributions Week 3 - 13.04.2026 to 19.04.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 14.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/ae2081828083925e908df26e0d71ad141e159309 | Add event category field with server-side filtering support | This is a basis from front and backend for the filtering, we then can add the fonctionnality to follow other users |
|                    | [date]   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/35f6a4d750a366be7c8f81dfca90cc83b5142dff | Redesign map markers with category icons, pulse for ongoing events, filter overlay and UI tweaks | more clean |
| **fra-a11y** | 10.04.2026  | https://github.com/claudioo2/sopra-fs26-group-21-server/pull/83/changes/cf2d5ba61ac05dd766b59d69bef1fe8dd7587426 | On the user profile page is possible to display the username and the bio  | Relevant for the user to see his profile page and info |
|                    | 19.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-client/issues/27 | Replaced "Photos" section in event modal with "View Board" button. Added /events/[id]/board page with header, back arrow and "+ Add Post" button. Add Post modal with 3 options: photo + comment, comment only, emoji picker | This feature is an interactive space of the app , where user can share their photos, comment and emoji of the event |
| **claudioo2** |  19.04.2026   | [[Link to Commit 1]](https://github.com/claudioo2/sopra-fs26-group-21-client/commit/d1f4aed71c2fe8f57d0152141080efc802d41623) | Clean up map page | Having a tidier/more aesthetic product with all functions clearly visible |
|                    | [date]   | [[Link to Commit 2]](https://github.com/claudioo2/sopra-fs26-group-21-client/commit/9f4a918681c2e541968e2e135cf348ef2761ac57) | Follow users| Part of the cooperation is being able to follow users and interact with them and their events |
| **Pascal-Trautmann** | [19.04.2026]   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/ac09e65507b125fb9aaa84c8b8106f2b17374c5e | updated the way we do the token validation and get users by token, I added a new annotation so we can cut on a lot of code duplication and make our code cleaner | It is essential that our codebase does not have too much code duplication as this can cause a lot of issues later on in the process |
|                    | [19.04.2026]   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/7a213e0d7e834c71819c054d5b6a44628b4b916b | I had to update the test suite so that the tests work with the changes from the first issue, I opened a new issue for this | It is important the test cases check the current implementation of the code, so I had to update the tests to reflect that |
| **semirIbra** | [15.04.2026/16.04.2026]   | [Backend: https://github.com/claudioo2/sopra-fs26-group-21-server/commit/8e08b19da148102a0883a6565453a4da7282a842 , Front-end: https://github.com/claudioo2/sopra-fs26-group-21-client/commit/b8ffd456d64ab445defa34f751ddbe899254ffca , Front-end: https://github.com/claudioo2/sopra-fs26-group-21-client/commit/01490112cebdf543c48c11b126710a09f44c2051] | [This is related to US14: Implemented the “Leave Event” functionality, allowing participants to exit an event. This includes closing the chat immediately after leaving, updating the UI so that “Leave Event” becomes “Join Event”, and removing the user from the event’s participant list in the backend.] | [This feature ensures that users maintain full control over their event participation. Leaving an event stops unwanted notifications, prevents further chat access and keeps the participant list accurate. This improves also the user experinnce]|
|                    | [16.04.2026]   | [Backend: https://github.com/claudioo2/sopra-fs26-group-21-server/commit/2abe60cbce182254045a1041e22b1c268299879c , Frontend: https://github.com/claudioo2/sopra-fs26-group-21-client/commit/dc714719caa3b27ee33aa0ba4cfca859c7e375e8] | [Implementation of the event deletion feature including a "Delete event" button on the event detail page along with backend logic to remove the event from the database. The map should ne updated by removing the corresponding marker] | [This ensures the removing of events from the database and updating the map view for a seamless user experience] |


---

## Contributions Week 4 - [20.04.2026] to [26.04.2026]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 24.04.2026   | [f394b54606cf500e3eb1e39d461f52a3dc54d9ad](https://github.com/claudioo2/sopra-fs26-group-21-server/commit/f394b54606cf500e3eb1e39d461f52a3dc54d9ad) | Websocket adapatation for Vercel | Websocket was working locally but is not supported in Google Cloud, so I used SockJS to solve that in case the serveur not responds to HTTP request from websocket |
|                    | 23.04.2026  | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/6b29f929e60f60f80954c23595e32ce52bf5e1e4 | Merge branch 'event-map-update': auth refactoring + Post feature | we had to merge 19 files about authentification and post features |
| **fra-a11y** | 20.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/fc6319635982ea324fe35a63270bd6340406cbb7 | This commit implements the horizontal layout of the event board: it transforms the display from a single column to a 3-column grid with post cards aligned horizontally. | The view board is a important feature of the app. The code now fetches posts from the /events/{eventId}/posts endpoint on component mount, handles the form submission to create new posts with proper error handling, and dynamically displays all posts in the horizontal grid layout.|
|                    | 20.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/24202512e93e33f4d128e76a852d83406dbe5395 |  Implements a new Post entity (supporting PHOTO, COMMENT, and EMOJI types) with repository, service, and controller layers exposing GET/POST endpoints for event posts, with access restricted to event participants. | This commit addresses issue #92 by enabling users to create and view different types of posts (photos with base64 encoding, comments, and emojis) within specific events, featuring proper authorization checks and CLOB storage for image data. |
| **claudioo2** | 24.04.26| https://github.com/claudioo2/sopra-fs26-group-21-server/commit/9d3218d48bfdb7bd121f29058ccaa3d6d03ed8b4 | Backend for multiple categories | Being able to have multiple categories for an event |
|                    | 24.04.26   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/a1595b3ca9069626cad11aa42be0259f657a99f1| Frontend for multiple categories  | Being able to have multiple categories for an event |
| **Pascal-Trautmann** | 26.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/31038958cfa61eedbe8499a494b5630e790611dd | I added the field allowPrivateMessages in user entity and respective DTO's and mapper, as well as userService | This allows users to choose weather to allow private messages or not, which is an optional feature for our application so that users can make their own choice about their privacy |
|                    | 26.04.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/64fc6ff8345a5975717fb77e3dccd80ab639d39d | I added a test for the issue #98  | We need to have a backend test for every issue we implement, so I implemented this test right away to stay ahead of the requirements |
| **semirIbra** | [21.04.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-server/commit/5b323c3ace5f2a8037dbba4c4265eb7d02cab79d] | [The backend provides an put method to update existing events allowing modification of fields such as title, description, end/start-time, location, category, privacy and images.] | [This enables event creators to keep event information up to date without recreating events, which is required for upcoming frontend editing functionality] |
|                    | [22.04.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/c5bbf25b2fbd674a08be241df3dc1059628a4e0c] | [Clicking on an edit icon allows the event description to be edited by the event creator only.] | [This improves user control over event content and ensures that only authorized users (creators) can modify event information. In general this is useful for the creator if the description needs to be updated.] |


---

## Contributions Week 5 - 27.04.2026 to 03.05.2026

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 01.05.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/762ee6f617b479a7fb48fde5f0b7edc2ce86ec54 | Merge branch 'follow-other-users': follow users + allowPrivateMessages | important merge to main (10 files modified) |
|                    | 03.05.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/b885d14bb5bdf5b469f23fe761b88d70a1cb5bdc | Add required unique email field on User (entity, DTOs, mapper, service uniqueness check) | important POV security and uniqueness |
| **fra-a11y** | 02.05.2026  |https://github.com/claudioo2/sopra-fs26-group-21-client/commit/8a5194c57fbde80a02c1c79c50bc742c39987563| The login and register page need to be improved, to lok more coherent with the rest. #41| It's relevant because it addresses issue #41 by giving the authentication pages a consistent, polished design matching the app's overall aesthetic. |
|                  |  02.05.2026   | client: https://github.com/claudioo2/sopra-fs26-group-21-client/commit/b6b41c479ac50d9037bccb152473bfb167fdb9ca  https://github.com/claudioo2/sopra-fs26-group-21-client/commit/bafd309b9d98f5bb05264fb4d5238b1eb9e6aeea server:https://github.com/claudioo2/sopra-fs26-group-21-server/commit/5ce8d44ef82697b03bc1fe59ca789e9dc1205396 | The user profile displays a list of upcoming events (1st commit link-client) the user is participating in. The user can directly click on the event card details (2nd commit link-client)#43 | The user now has a overview of the events he joined, and can directly access the detail card of the event, without going to the map. |
| **claudioo2** | 02.05.2026   | [[Link to Commit 1]](https://github.com/claudioo2/sopra-fs26-group-21-client/commit/1cb4f3fa51721375b00204cddf7451ed74a7af8f) | Fix map markers | Map markers were running away when zooming in/out and that's not intended behaviour] |
|                    | 03.05.2026   | [[Link to Commit 2] ](https://github.com/claudioo2/sopra-fs26-group-21-server/commit/efd3bd911bcd4005242c0945b31773608dcb6c9c)| Unfollow users functionality | Its relevant to be able to both follow and unfollow users |
| **Pascal-Trautmann** | 03.05.2026   | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/83eb7b8e19c5d2f719b48fd0a4039f22eb1102d2 | I added the rating feature so you can rate the event creator for every event, and the event creator carries an average rating | this feature allows users to better estimate what events might be good because you can see a rating of the organizer and it also allows them to provide event creators with feedback in form of the rating |
|                    | 03.05.2026  | https://github.com/claudioo2/sopra-fs26-group-21-server/commit/c1d825361bfcdd848b97c5c76f40747c98b558ca | I made it so that the event creator can't rate themselves on their own events | This is crutial because it prevents abuse, if people could rate themselves then they could inflate ratings and possibly make the ratings less meaningful |
| **semirIbra** | [30.04.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-server/commit/56408585873e84d01eaa71fbd12ab306fb963c55] | [Implementation of the functionality to follow other users (in the backend). Includes a new controller endpoint, User entity update, service logic with validation and testing] | [Adds the ability for users to follow others for enhancing social interaction. Without this functionality other features (user stories) cannot be implemented.] |
|                    | [01.05.2026]   | [https://github.com/claudioo2/sopra-fs26-group-21-client/commit/f2667f88ff615dce8ac12f52d8fb2c79bc83944d, https://github.com/claudioo2/sopra-fs26-group-21-client/commit/d8adb4f2ec5a390616dea1f03e5a4b130f8f92fa, https://github.com/claudioo2/sopra-fs26-group-21-client/commit/f2fb3d85b89a0c3012a7ebd1410616c5ce4b40d3] | [User Story 11 (3 issues): Users can select a "Friends Only" filter that shows them events that are at least visited by one friend/follower. If there is no friend that visits an event, an appropriate message appears] | [This leverages the follow/friend relationships to personalize event discovery and improves user experience by highlighting socially relevant events and providing clear feedback when no such events are available] |


---

## Contributions Week 6 - [Begin Date] to [End Date]

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **GabrielVuattoux** | 04.05.2026   | https://github.com/claudioo2/sopra-fs26-group-21-client/commit/646fa86 | Cluster overlapping events on the map with spiderfy expansion (closes #112) — donut markers with category-coloured petals proportional to count, click expands into a spider with leader lines | Several events at the same location used to stack on top of each other and become impossible to click individually; this fixes the issue and improves readability when many events overlap |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **fra-a11y** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **claudioo2** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **Pascal-Trautmann** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **semirIbra** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

