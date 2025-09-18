# Interview Schedule

- 5 mins of intros
- 45 mins of coding
- 10 mins of Q/A

## Main Task

Write a new component that displays a list of items (uid and name) from the following endpoint:

```
GET https://swapi.tech/api/people/
```

## Extra (as time allows)

### Delete Button

- Make a button next to each item that can remove it from the list
- Update the UI to reflect the change. (Hypothetical updates to the server can be coded in comments)
- Consider handling scenarios where the request to the server fails.

### Pagination

- The API allows for pagination via query params
- How would you show all the records in the UI?

```
https://swapi.tech/api/people/?page=2

"count": 82,
"next": "https://swapi.tech/api/people/?page=3",
"previous": "https://swapi.tech/api/people/?page=1",
```

### Details Page

- click into each item to see their details

### Error Handling

- If the request was not successful, handle the error

### Loading State

- Display a loading state that can show up while the data is being fetched

### Responsive Layout

- Display the items in a responsive grid
