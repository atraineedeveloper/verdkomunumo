## ADDED Requirements

### Requirement: Member cards show contact and social links when present

The system SHALL display a member's website, contact email, and social links on
the map member list/card wherever that member's opted-in public info already
appears, rendering only the fields the member has actually filled in.

#### Scenario: Member with all optional fields filled in

- GIVEN a map-visible member who has set a website, a contact email, and at
  least one social link
- WHEN their card is rendered in the map member list
- THEN the website, contact email, and social links are shown alongside their
  existing name, avatar, and location

#### Scenario: Member with none of the optional fields filled in

- GIVEN a map-visible member who has not set a website, contact email, or any
  social link
- WHEN their card is rendered in the map member list
- THEN the card renders exactly as it does today, with no empty placeholders
  for the missing fields
