# hackathon-backend
Boilerplate node, typescript repo to get basic user auth &amp; end points started

# Todo

# Script for dummy data migrations
    - create all mock resources

## Api endpoints:
    - GET /ads - gets all ads & ad tasks DONE
    - POST /ads - create new ad (need to get advertiser)
    - POST /tasks - create new task (need to get advertiser)
    - POST /completed_tasks - save user's completedTask (need to get user)

    - PUT /reviews/task
    - PUT /reviews/feedback
    - PUT /reviews/advertiser
    - PUT /reviews/user

should user be advertiser..? dont want to manage 2..
make user, they can advertise if they want.
user email, pass, name.
but when making advertiser, just need unique name.
if user logs in, they can.. complete tasks..
or post as advertiser. 
how about if theyre completely same?
user has balance, etc. 
yeah.. cause they both have balance..