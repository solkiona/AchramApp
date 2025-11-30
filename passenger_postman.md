Passenger ﻿

Authorization Bearer Token Token Registration ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger POST Registration /auth/passenger/register ﻿

Body raw (json) json { "email": "idenyi.dev@gmail.com", "phone_number":
"23408123338579", "first_name": "Gabriel", "last_name": "Idenyi",
"password": "p@ss123Word" } Example 201 Created Request cURL curl
--location '/auth/passenger/register'\
--data-raw '{ "email": "idenyi.dev@gmail.com", "phone_number":
"23408123338579", "first_name": "Gabriel", "last_name": "Idenyi",
"password": "p@ss123Word" }' 201 CREATED Response Body Headers (10) Text
{ "status": "success", "message": "Registration successful, proceed to
verification.", "data": null } POST Verify Email
/auth/passenger/verify-email ﻿

Body raw (json) View More json { "token":
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjYxNDQsImlhdCI6MTc2MTA2MjU0NCwic3ViX2lkIjoiMDE5YTA3ODFlNDExNzIyY2E3Y2Q1MGZhYzViNjNiZDMifQ.Bi2KvDlpo2bxLIvLca8A-ueLVaIY1XXaUlMyrZ5gLHQ"
} Example 200 OK Request View More cURL curl --location
'/auth/passenger/verify-email'\
--data '{ "token":
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjA4NzIxOTYsImlhdCI6MTc2MDg2ODU5Niwic3ViX2lkIjoiMDE5OWZiZjI3NzQwN2M4NmJiNGEyZTcxNDZhZTg1MjMifQ.NtoMuYX4ApeOEcS4B7WssbUoUZzSrp4CKtR5N8SJNl4"
}' 200 OK Response Body Headers (10) Text { "status": "success",
"message": "Email verification successful.", "data": null }
Authentication ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger POST Login /auth/passenger/login ﻿

Body raw (json) json { "email": "idenyi.dev@gmail.com", "password":
"p@ss123Word" } Example 200 OK Request cURL curl --location
'/auth/passenger/login'\
--data-raw '{ "email": "idenyi.dev@gmail.com", "password": "p@ss123Word"
}' 200 OK Response Body Headers (10) Text { "status": "success",
"message": "Login successful", "data": { "token":
"f4rt_xzF20yyivghFgKRuV_fhc7IeDUmfpfaaLoquDg" } } POST Verify 2FA Login
/auth/passenger/2fa/verify ﻿

Body raw (json) json { "email": "idenyi.dev@gmail.com", "password":
"p@ss123Word", "otp": "263916" } Example 200 OK Request cURL curl
--location '/auth/passenger/2fa/verify'\
--data-raw '{ "email": "idenyi.dev@gmail.com", "password":
"p@ss123Word", "otp": "263916" }' 200 OK Response Body Headers (10) Text
{ "status": "success", "message": "Login successful", "data": { "token":
"oS6KLdEinYyB_LdUTMqWrB6ZNCcHzodK_CX7NXZOmY4" } } POST Logout
/auth/logout ﻿

Example 200 OK Request cURL curl --location --request POST
'/auth/logout' 200 OK Response Body Headers (11) Text { "status":
"success", "message": "Logout successful.", "data": null } POST Logout
All /auth/logout-all ﻿

Example 200 OK Request cURL curl --location --request POST
'/auth/logout-all' 200 OK Response Body Headers (11) Text { "status":
"success", "message": "Logout all successful.", "data": null } POST
Password Reset Email /auth/passenger/reset ﻿

Body raw (json) json { "email": "idenyi.dev@gmail.com" } Example 200 OK
Request cURL curl --location '/auth/passenger/reset'\
--data-raw '{ "email": "idenyi.dev@gmail.com" }' 200 OK Response Body
Headers (10) Text { "status": "success", "message": "Reset email sent
successfully.", "data": null } POST Password Reset Confirm
/auth/passenger/confirm-reset ﻿

Body raw (json) json { "otp": "459791", "password": "p@ss123Word",
"email": "idenyi.dev@gmail.com" } Example 200 OK Request cURL curl
--location '/auth/passenger/confirm-reset'\
--data-raw '{ "otp": "459791", "password": "p@ss123Word", "email":
"idenyi.dev@gmail.com" }' 200 OK Response Body Headers (10) Text {
"status": "success", "message": "Password reset successfully.", "data":
null } Authenticated ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger GET Check Status /auth/passenger/authenticated ﻿

Example 200 OK Request cURL curl --location
'/auth/passenger/authenticated' 200 OK Response Body Headers (10) Text {
"status": "success", "message": "Authentication check successful.",
"data": null } GET Retrieve Account /auth/passenger/me ﻿

Example 200 OK Request cURL curl --location '/auth/passenger/me' 200 OK
Response Body Headers (10) View More Text { "status": "success",
"message": "Account retrieved successfully.", "data": { "id":
"0199fbf2-773f-761a-8412-2c944cbb231a", "name": "Gabriel Passenger",
"initials": "GP", "email": "idenyi.dev@gmail.com", "last_name":
"Passenger", "first_name": "Gabriel", "phone_number": "+234 812 333
8579", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/qcasmtg4iyun1gatw9um.jpeg",
"preferred_language": { "label": "English", "value": "en" },
"is_active": true, "is_2fa_enabled": false, "verified_at":
"2025-10-19T10:12:48", "last_login": "2025-11-16T07:59:05",
"created_at": "2025-10-19T10:09:56", "updated_at":
"2025-11-12T05:40:38", "profile": { "status": { "label": "Offline",
"value": "offline" }, "wallet": { "balance": { "formatted": "NGN0.00",
"currency": "NGN", "amount": 0.0 } }, "active_trip": null } } } PATCH
Update Account /auth/passenger/me ﻿

Body form-data email idenyi.dev@gmail.com phone_number +2348123338579
first_name Gabriel last_name Passenger is_2fa_enabled false
profile_photo /home/gabriel/Downloads/uber.webp preferred_language en
Example 200 OK Request cURL curl --location --request PATCH
'/auth/passenger/me'\
--form 'email="idenyi.dev@gmail.com"'\
--form 'phone_number="+2348123338579"'\
--form 'first_name="Gabriel"'\
--form 'last_name="Passenger"'\
--form 'is_2fa_enabled="false"'\
--form 'profile_photo=@"/home/gabriel/Downloads/uber.webp"'\
--form 'preferred_language="en"' 200 OK Response Body Headers (10) View
More Text { "status": "success", "message": "Account updated
successfully.", "data": { "id": "0199fbf2-773f-761a-8412-2c944cbb231a",
"name": "Gabriel Passenger", "initials": "GP", "email":
"idenyi.dev@gmail.com", "last_name": "Passenger", "first_name":
"Gabriel", "phone_number": "+234 812 333 8579", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/qcasmtg4iyun1gatw9um.jpeg",
"preferred_language": { "label": "English", "value": "en" },
"is_active": true, "is_2fa_enabled": false, "verified_at":
"2025-10-19T10:12:48", "last_login": "2025-11-16T07:59:05",
"created_at": "2025-10-19T10:09:56", "updated_at":
"2025-11-16T08:01:34", "profile": { "status": { "label": "Offline",
"value": "offline" }, "wallet": { "balance": { "formatted": "NGN0.00",
"currency": "NGN", "amount": 0 } }, "active_trip": null } } } POST Send
OTP /auth/passenger/send-otp ﻿

Example 200 OK Request cURL curl --location --request POST
'/auth/passenger/send-otp' 200 OK Response Body Headers (10) Text {
"status": "success", "message": "OTP sent successfully.", "data": null }
POST Change Password /auth/passenger/change-password ﻿

Body raw (json) json { "old_password": "p@ss123Word", "new_password":
"p@ss123Word" } Example 200 OK Request cURL curl --location
'/auth/passenger/change-password'\
--data-raw '{ "old_password": "p@ss123Word", "new_password":
"p@ss123Word" }' 200 OK Response Body Headers (10) Text { "status":
"success", "message": "Password updated successfully.", "data": null }
Trips ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger Guest ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger POST Book Trip /trips/guest-booking ﻿

Body raw (json) View More json { "amount": {"amount": "1000",
"currency": "NGN"}, // optional (this is the expected amount for the
trip based on destination (retrieved from the fare endpoing) "airport":
"019a2504-3f78-7dc9-ace6-a3f671e160cf", // "airport":
"0199de42-10b4-7f53-b670-42f107897a1d", "guest_name": "Gabriel Idenyi",
"guest_email": "idenyigabriel@gmail.com", "guest_phone":
"+2348072502035", "has_extra_leg_room": false, // optional
"has_extra_luggage": false, // optional "has_wheel_chair_access": false,
// optional "pickup_address": "Murtala Muhammed Airport",
"pickup_location": \[3.330058,6.568287\], "destination_address":
"Ikorodu, Lagos", "destination_location": \[ 3.504145, 6.620891\] }
Example 201 Created Request View More cURL curl --location
'/trips/guest-booking'\
--data-raw '{ "amount": {"amount": "1000", "currency": "NGN"}, //
optional (this is the expected amount for the trip based on destination
(retrieved from the fare endpoing) "airport":
"0199de4210b47f53b67042f107897a1d", "guest_name": "Gabriel Idenyi",
"guest_email": "idenyigabriel@gmail.com", "guest_phone":
"+2348072502035", "has_extra_leg_room": false, // optional
"has_extra_luggage": false, // optional "has_wheel_chair_access": false,
// optional "pickup_address": "Murtala Muhammed Airport",
"pickup_location": \[3.330058,6.568287\], "destination_address":
"Ikorodu, Lagos", "destination_location": \[ 3.504145, 6.620891\] }' 201
CREATED Response Body Headers (10) View More Text { "status": "success",
"message": "Trip created successfully.", "data": { "id":
"019a72b6-96eb-7784-be5b-e47fc4e2147d", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Searching", "value": "searching" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"862343", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "guest": { "id":
"019a72b6-96e5-7fdb-89aa-309bd1d85525", "name": "Gabriel Idenyi",
"email": "idenyigabriel@gmail.com", "phone_number": "+234 807 250 2035",
"expires_at": "2025-11-11T12:39:20", "url":
"https://app.achrams.com.ng/trips/019a72b6-96e5-7fdb-89aa-309bd1d85525"
}, "driver": null } } GET Retrieve Trip
/trips/019aa110-fda4-73f3-8af2-fcfa60c75213 ﻿

Example 200 OK Request cURL curl --location
'/trips/019a8ee5-a322-7af8-8e99-21240365551d'\
--header 'X-Guest-Id: 019a8ee5-a322-7af8-8e99-21240365551d' 200 OK
Response Body Headers (10) View More Text { "status": "success",
"message": "Trip retrieved successfully.", "data": { "id":
"019a8ee5-a326-7749-a15d-20905464c1a1", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Cancelled", "value": "cancelled" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"697351", "rating": { "score": 4, "comment": "Good ride" }, "map_data":
{ "pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"guest": { "id": "019a8ee5-a322-7af8-8e99-21240365551d", "name":
"Gabriel Idenyi", "email": "idenyigabriel@gmail.com", "phone_number":
"+234 807 250 2035", "expires_at": "2025-11-18T00:00:05", "url":
"https://app.achrams.com.ng/trips/019a8ee5-a322-7af8-8e99-21240365551d"
}, "driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } POST Raise Trip
Alert /trip-alerts ﻿

Body raw (json) json { "alert_type": "panic", "address": "Obafemi
Awolowo road, ikeja Lagos.", "location": \[8.392181, 7.283721\], //
longitude, latitude "message": "Driver is just messings up randomly." //
optional } Example 201 Created Request View More cURL curl --location
'/trip-alerts'\
--header 'X-Guest-Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjE3NzkzODV9.LYV4Y4cW4l1K_PFMLFPsGvA4cz1VNCZOpo0S3w6qzuI'\
--data '{ "alert_type": "panic", "address": "Obafemi Awolowo road, ikeja
Lagos.", "location": \[8.392181, 7.283721\], // longitude, latitude
"message": "Driver is just messing up randomly." // optional }' 201
CREATED Response Body Headers (10) Text { "status": "success",
"message": "Alert created successfully.", "data": null } POST Cancel
Trip /trips/019a8ee5-a322-7af8-8e99-21240365551d/cancel ﻿

Body raw (json) json { "reason": "Did not find driver", // required when
trip status is not searching. "location": \[3.330058,6.568287\],
"address": "Murtala Muhammed Airport" } Example 200 OK Request cURL curl
--location '/trips/019a7c7f-d54c-7520-bbb9-e2d1831f4e30/cancel'\
--header 'X-Guest-Id: 019a7c7c-d6de-7d55-9074-bf5066e68de3'\
--data '{ "reason": "Did not find driver", // required when trip status
is not searching. "location": \[3.330058,6.568287\], "address": "Murtala
Muhammed Airport" }' 201 CREATED Response Body Headers (10) View More
Text { "status": "success", "message": "Trip cancelled successfully.",
"data": { "id": "019a7c7f-d555-712d-b408-e66bb20d8549", "amount": {
"formatted": "NGN1,000.00", "currency": "NGN", "amount": 1000 },
"status": { "label": "Cancelled", "value": "cancelled" },
"pickup_address": "Murtala Muhammed Airport", "destination_address":
"Ikorodu, Lagos", "verification_code": "707553", "rating": null,
"map_data": { "pickup_location": { "type": "Feature", "geometry": {
"type": "Point", "coordinates": \[ 3.330058, 6.568287 \] },
"properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "guest": { "id":
"019a7c7f-d54c-7520-bbb9-e2d1831f4e30", "name": "Gabriel Idenyi",
"email": "idenyigabriel@gmail.com", "phone_number": "+234 807 250 2035",
"expires_at": "2025-11-13T10:15:43", "url":
"https://app.achrams.com.ng/trips/019a7c7f-d54c-7520-bbb9-e2d1831f4e30"
}, "driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } POST Rate Trip
/trips/019a8ee5-a322-7af8-8e99-21240365551d/rate ﻿

Body raw (json) json { "score": 4, "comment": "Good ride" } Example 200
OK Request cURL curl --location
'/trips/019a8ee5-a326-7749-a15d-20905464c1a1/rate'\
--header 'X-Guest-Id: 019a8ee5-a322-7af8-8e99-21240365551d'\
--data '{ "score": 4, "comment": "Good ride" }' 201 CREATED Response
Body Headers (10) View More Text { "status": "success", "message": "Trip
rated successfully.", "data": { "id":
"019a8ee5-a326-7749-a15d-20905464c1a1", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Completed", "value": "completed" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"697351", "rating": { "score": 4, "comment": "Good ride" }, "map_data":
{ "pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"guest": { "id": "019a8ee5-a322-7af8-8e99-21240365551d", "name":
"Gabriel Idenyi", "email": "idenyigabriel@gmail.com", "phone_number":
"+234 807 250 2035", "expires_at": "2025-11-17T00:00:05", "url":
"https://app.achrams.com.ng/trips/019a8ee5-a322-7af8-8e99-21240365551d"
}, "driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } Authenticated ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger POST Book Trip /trips ﻿

Body raw (json) View More json { "amount": {"amount": "1000",
"currency": "NGN"}, // optional (this is the expected amount for the
trip based on destination (retrieved from the fare endpoing) "airport":
"0199de4210b47f53b67042f107897a1d", "has_extra_leg_room": false, //
optional "has_extra_luggage": false, // optional
"has_wheel_chair_access": false, // optional "pickup_address": "Murtala
Muhammed Airport", "pickup_location": \[3.330058,6.568287\],
"destination_address": "Ikorodu, Lagos", "destination_location": \[
3.504145, 6.620891\] } Example 201 Created Request View More cURL curl
--location '/trips'\
--data '{ "amount": {"amount": "1000", "currency": "NGN"}, // optional
(this is the expected amount for the trip based on destination
(retrieved from the fare endpoing) "airport":
"0199de4210b47f53b67042f107897a1d", "has_extra_leg_room": false, //
optional "has_extra_luggage": false, // optional
"has_wheel_chair_access": false, // optional "pickup_address": "Murtala
Muhammed Airport", "pickup_location": \[3.330058,6.568287\],
"destination_address": "Ikorodu, Lagos", "destination_location": \[
3.504145, 6.620891\] }' 201 CREATED Response Body Headers (10) View More
Text { "status": "success", "message": "Trip created successfully.",
"data": { "id": "019a72b8-7258-76bf-996a-27723f2a1e97", "amount": {
"formatted": "NGN1,000.00", "currency": "NGN", "amount": 1000 },
"status": { "label": "Searching", "value": "searching" },
"pickup_address": "Murtala Muhammed Airport", "destination_address":
"Ikorodu, Lagos", "verification_code": "196046", "rating": null,
"map_data": { "pickup_location": { "type": "Feature", "geometry": {
"type": "Point", "coordinates": \[ 3.330058, 6.568287 \] },
"properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null } } GET List Trips /trips ﻿

Query Params limit 1 This query is used to limit record count returned
in response

page 2 This query is used to transverse through pages

status completed This query is used to filter by status field

date 2024-10-10,2025-11-01 This query is used to filter by date

Example 200 OK Request cURL curl --location '/trips' 200 OK Response
Body Headers (10) View More Text { "count": 46, "next": 2, "previous":
null, "page_size": 25, "page_count": 2, "current_page": 1, "results": \[
{ "id": "019aa198-6862-74d5-9918-9524e84e99ba", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Searching", "value": "searching" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"065820", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a924e-219d-78da-999a-3be93cddb31e", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Cancelled", "value": "cancelled" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"848429", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a9247-52ec-75c5-bd01-79e81fa8ba11", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "480153", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a9247-0c34-72da-a92b-6f4a61986af3",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Cancelled", "value": "cancelled" },
"pickup_address": "Murtala Muhammed Airport", "destination_address":
"Ikorodu, Lagos", "verification_code": "420260", "rating": null,
"map_data": { "pickup_location": { "type": "Feature", "geometry": {
"type": "Point", "coordinates": \[ 3.330058, 6.568287 \] },
"properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a9244-a9f2-72f1-a9da-797fad2a21ec", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "985580", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a9238-c297-705e-85ed-81ba8b19cb08",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "174903",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a9238-4841-7106-bc24-2162ea0a8953", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "029728", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a921b-bcaf-7c54-8a9d-1aa3e7cc9589",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Cancelled", "value": "cancelled" },
"pickup_address": "Murtala Muhammed Airport", "destination_address":
"Ikorodu, Lagos", "verification_code": "527012", "rating": null,
"map_data": { "pickup_location": { "type": "Feature", "geometry": {
"type": "Point", "coordinates": \[ 3.330058, 6.568287 \] },
"properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a9219-08f9-73e4-ae62-3954097310d0", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "774441", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a9216-9181-729e-a436-099903446057",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "878325",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a7c83-f353-76a1-a3ea-1ab32a6c9767", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Cancelled", "value": "cancelled" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"987539", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a7c80-4635-7125-a154-7bd85fd44aca", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Cancelled", "value": "cancelled" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"563820", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a7a02-f675-7886-aa02-318f80dd2bef", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Completed", "value": "completed" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"863039", "rating": { "score": 5, "comment": "Nice Ride" }, "map_data":
{ "pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a7386-a5c5-79f1-8cdf-bb79a2a2064e", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Completed", "value": "completed" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"329301", "rating": null, "map_data": { "pickup_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.330058,
6.568287 \] }, "properties": { "name": "Pickup Location", "description":
"Murtala Muhammed Airport" } }, "destination_location": { "type":
"Feature", "geometry": { "type": "Point", "coordinates": \[ 3.504145,
6.620891 \] }, "properties": { "name": "Destination Location",
"description": "Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } }, { "id":
"019a72d0-9226-70ef-a894-04ad53b92d39", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "309299", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a72cf-e70a-773c-a609-5f8ceb81fb2b",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "750590",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a72b8-7258-76bf-996a-27723f2a1e97", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "196046", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a71e0-ac49-7990-9ab1-c79913aaaa6a",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "652502",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a71de-f308-7faa-baf8-0061b449c8bd", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "034616", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a71dd-1c3e-740d-a984-b5ddccab1726",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "681234",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a71da-3dd4-7769-a0d5-47b8f21dc707", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "565743", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a71d9-d1f6-7003-a1d4-5b80b887d8f8",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "493755",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a71d7-e1e7-7752-aaae-9e7b38f80aa7", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "747282", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null }, { "id": "019a71d7-01e6-7f8a-bec7-9a5f0ac5e50f",
"amount": { "formatted": "NGN1,000.00", "currency": "NGN", "amount":
1000 }, "status": { "label": "Driver not found", "value": "driver not
found" }, "pickup_address": "Murtala Muhammed Airport",
"destination_address": "Ikorodu, Lagos", "verification_code": "358205",
"rating": null, "map_data": { "pickup_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.330058, 6.568287 \]
}, "properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": null }, { "id":
"019a71d6-a6e3-761b-a877-15ce56b7a71e", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Driver not found", "value": "driver not found" }, "pickup_address":
"Murtala Muhammed Airport", "destination_address": "Ikorodu, Lagos",
"verification_code": "006434", "rating": null, "map_data": {
"pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": null } \] } GET Retrieve Trip
/trips/019a46b4-3df6-7356-ae1e-740321ae1b21 ﻿

Query Params status completed This query is used to filter by status
field

date 2024-10-10,2025-11-01 This query is used to filter by date

Body raw (text) text { "location": \[3.1212, 4.13231\], "address":
"Murtala Muhammed Airport", "reason": "Could not find passenger" }
Example 200 OK Request cURL curl --location
'/trips/019a46b4-3df6-7356-ae1e-740321ae1b21' 200 OK Response Body
Headers (10) View More Text { "status": "success", "message": "Trip
retrieved successfully.", "data": { "id":
"019a46b4-3df6-7356-ae1e-740321ae1b21", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Completed", "value": "completed" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"000000", "rating": { "score": 5, "comment": "Good Ride" }, "map_data":
{ "pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } POST Raise Trip
Alert /trip-alerts ﻿

Body raw (json) json { "alert_type": "panic", "address": "Obafemi
Awolowo road, ikeja Lagos.", "location": \[8.392181, 7.283721\], //
longitude, latitude "trip": "019a3951-c8e6-7bc9-b163-69a5a80aef5c",
"message": "Driver is just messing up randomly." // optional } Example
201 Created Request cURL curl --location '/trip-alerts'\
--data '{ "alert_type": "panic", "address": "Obafemi Awolowo road, ikeja
Lagos.", "location": \[8.392181, 7.283721\], // longitude, latitude
"trip": "019a3951-c8e6-7bc9-b163-69a5a80aef5c", "message": "Driver is
just messing up randomly." // optional }' 201 CREATED Response Body
Headers (10) Text { "status": "success", "message": "Alert created
successfully.", "data": null } POST Cancel Trip
/trips/019a9247-0c34-72da-a92b-6f4a61986af3/cancel ﻿

Query Params status completed This query is used to filter by status
field

date 2024-10-10,2025-11-01 This query is used to filter by date

Body raw (json) json { "reason": "Did not find driver", // required when
trip status is not searching. "location": \[3.330058,6.568287\],
"address": "Murtala Muhammed Airport" } Example 200 OK Request cURL curl
--location '/trips/019a7c80-4635-7125-a154-7bd85fd44aca/cancel'\
--data '{ "reason": "Did not find driver", // required when trip status
is not searching. "location": \[3.330058,6.568287\], "address": "Murtala
Muhammed Airport" }' 201 CREATED Response Body Headers (10) View More
Text { "status": "success", "message": "Trip cancelled successfully.",
"data": { "id": "019a7c80-4635-7125-a154-7bd85fd44aca", "amount": {
"formatted": "NGN1,000.00", "currency": "NGN", "amount": 1000 },
"status": { "label": "Cancelled", "value": "cancelled" },
"pickup_address": "Murtala Muhammed Airport", "destination_address":
"Ikorodu, Lagos", "verification_code": "563820", "rating": null,
"map_data": { "pickup_location": { "type": "Feature", "geometry": {
"type": "Point", "coordinates": \[ 3.330058, 6.568287 \] },
"properties": { "name": "Pickup Location", "description": "Murtala
Muhammed Airport" } }, "destination_location": { "type": "Feature",
"geometry": { "type": "Point", "coordinates": \[ 3.504145, 6.620891 \]
}, "properties": { "name": "Destination Location", "description":
"Ikorodu, Lagos" } } }, "driver": { "id":
"0199e258-ead5-7b57-8930-f923322b9b2a", "name": "Gabriel Driver",
"car_type": "Toyota Camry", "car_color": "Red", "car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } POST Rate Trip
/trips/019a8ee5-a326-7749-a15d-20905464c1a1/rate ﻿

Body raw (json) json { "score": 4, "comment": "Good ride" } Example 200
OK Request cURL curl --location
'/trips/019a8ee5-a326-7749-a15d-20905464c1a1/rate'\
--data '{ "score": 4, "comment": "Good ride" }' 201 CREATED Response
Body Headers (10) View More Text { "status": "success", "message": "Trip
rated successfully.", "data": { "id":
"019a8ee5-a326-7749-a15d-20905464c1a1", "amount": { "formatted":
"NGN1,000.00", "currency": "NGN", "amount": 1000 }, "status": { "label":
"Completed", "value": "completed" }, "pickup_address": "Murtala Muhammed
Airport", "destination_address": "Ikorodu, Lagos", "verification_code":
"697351", "rating": { "score": 4, "comment": "Good ride" }, "map_data":
{ "pickup_location": { "type": "Feature", "geometry": { "type": "Point",
"coordinates": \[ 3.330058, 6.568287 \] }, "properties": { "name":
"Pickup Location", "description": "Murtala Muhammed Airport" } },
"destination_location": { "type": "Feature", "geometry": { "type":
"Point", "coordinates": \[ 3.504145, 6.620891 \] }, "properties": {
"name": "Destination Location", "description": "Ikorodu, Lagos" } } },
"guest": { "id": "019a8ee5-a322-7af8-8e99-21240365551d", "name":
"Gabriel Idenyi", "email": "idenyigabriel@gmail.com", "phone_number":
"+234 807 250 2035", "expires_at": "2025-11-17T00:00:05", "url":
"https://app.achrams.com.ng/trips/019a8ee5-a322-7af8-8e99-21240365551d"
}, "driver": { "id": "0199e258-ead5-7b57-8930-f923322b9b2a", "name":
"Gabriel Driver", "car_type": "Toyota Camry", "car_color": "Red",
"car_photo":
"http://localhost:8000/resources/media/car_photos/qcasmtg4iyun1gatw9um.jpeg",
"plate_number": "ENU-9981726", "profile_photo":
"http://localhost:8000/resources/media/profile_photos/uber.webp",
"has_extra_leg_room": false, "has_extra_trunk_space": false,
"has_wheel_chair_access": false, "rating": "5.0" } } } Wallet History ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger GET List History /wallets/history ﻿

Query Params limit 10 This query is used to limit record count returned
in response

page 2 This query is used to transverse through pages

status successful This query is used to filter by status field

date 2024-10-10,2026-10-10 This query is used to filter by date field

Example 200 OK Request cURL curl --location '/wallets/history' 200 OK
Response Body Headers (10) View More Text { "count": 1, "next": null,
"previous": null, "page_size": 25, "page_count": 1, "current_page": 1,
"results": \[ { "id": "019a9777-1b63-74bd-8894-f8ad93f705d5",
"reference": "ACHRAMS-DEP-019A97771B4F7354B340686E75A234EA", "amount": {
"formatted": "NGN100.00", "currency": "NGN", "amount": 100 },
"entry_type": { "label": "Credit", "value": "credit" }, "status": {
"label": "Successful", "value": "successful" }, "party_name": null,
"bank_name": "TEST BANK", "bank_code": null, "account_number": null,
"card_last4": "4081", "card_scheme": "visa", "narration": "Test
deposit", "payment_channel": "card", "created_at":
"2025-11-18T14:55:56", "updated_at": "2025-11-18T14:55:56" } \] } GET
Retrieve History /wallets/history/019a9777-1b63-74bd-8894-f8ad93f705d5 ﻿

Query Params status successful This query is used to filter by status
field

date 2024-10-10,2026-10-10 This query is used to filter by date field

Example 200 OK Request cURL curl --location
'/wallets/history/019a9777-1b63-74bd-8894-f8ad93f705d5' 200 OK Response
Body Headers (10) View More Text { "status": "success", "message":
"Wallet history retrieved successfully", "data": { "id":
"019a9777-1b63-74bd-8894-f8ad93f705d5", "reference":
"ACHRAMS-DEP-019A97771B4F7354B340686E75A234EA", "amount": { "formatted":
"NGN100.00", "currency": "NGN", "amount": 100 }, "entry_type": {
"label": "Credit", "value": "credit" }, "status": { "label":
"Successful", "value": "successful" }, "party_name": null, "bank_name":
"TEST BANK", "bank_code": null, "account_number": null, "card_last4":
"4081", "card_scheme": "visa", "narration": "Test deposit",
"payment_channel": "card", "created_at": "2025-11-18T14:55:56",
"updated_at": "2025-11-18T14:55:56" } } Banking ﻿

Authorization Bearer Token This folder is using an authorization helper
from folder Passenger POST Deposit Funds /wallets/deposit ﻿

Body raw (json) json { "amount": {"currency": "NGN", "amount": 100},
"narration": "Test deposit" // optional } Example 200 OK Request cURL
curl --location '/wallets/deposit'\
--data '{ "amount": {"currency": "NGN", "amount": 100}, "narration":
"Test deposit" // optional }' 200 OK Response Body Headers (10) Text {
"status": "success", "message": "Deposit initiated successfully",
"data": { "access_code": "a3u2iv88stuojqh" } } POST Withdraw Funds
/wallets/withdraw ﻿

Body raw (json) json { "amount": {"amount": 100, "currency": "NGN"},
"account_name": "Gabriel A. Idenyi", "account_number": "0000000000",
"bank_code": "057", "narration": "Test Narration" // optional } Example
200 OK \[Processing\] Request cURL curl --location '/wallets/withdraw'\
--data '{ "amount": {"amount": 100, "currency": "NGN"}, "account_name":
"Gabriel A. Idenyi", "account_number": "0000000000", "bank_code": "057",
"narration": "Test Narration" // optional }' 200 OK Response Body
Headers (10) View More Text { "status": "success", "message": "Transfer
processing", "data": { "id": "019a9783-c6b9-7c57-894c-d03974bff1ef",
"reference": "ACHRAMS-WDL-019A9783C6957F00B3037D141970DED3", "fee": {
"formatted": "NGN10.00", "currency": "NGN", "amount": 10.0 }, "amount":
{ "formatted": "NGN100.00", "currency": "NGN", "amount": 1250.0 },
"entry_type": { "label": "Debit", "value": "debit" }, "status": {
"label": "Processing", "value": "processing" }, "party_name": "Gabriel
A. Idenyi", "bank_name": "Zenith Bank", "bank_code": "057",
"account_number": "0000000000", "card_last4": null, "card_scheme": null,
"narration": "Test Narration", "payment_channel": "transfer",
"created_at": "2025-11-18T15:09:47", "updated_at": "2025-11-18T15:09:47"
} } POST Log QR Code Scan
/qrcodes/0199fe10-4439-7d06-9f40-33a6beacf05e/log ﻿

Example 201 Created Request cURL curl --location
'/qrcodes/0199fe10-4439-7d06-9f40-33a6beacf05e/log'\
--data '{ "ip_address": "127.0.0.1", "user_agent": "Microsoft X/Chrome"
}' 201 CREATED Response Body Headers (10) Text { "status": "success",
"message": "QRCode scan logged successfully", "data": null }
