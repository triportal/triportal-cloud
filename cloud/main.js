Parse.Cloud.define("fork_itinerary", function(request, response) {
    if (!request.user)
        return response.error("No permission");
    if (!request.params.id)
        return response.error("Id undefined");
    var query = new Parse.Query("Itinerary");
    query.get(request.params.id)
    .then(function(itinerary) {
        var forked_itinerary = itinerary.clone();
        forked_itinerary.set("owner", request.user);
        return forked_itinerary.save()
        .then(function(saved_itinerary) {
            var query = new Parse.Query("Day");
            query.equalTo("itinerary", itinerary);
            return query.find().then(function(days) {
                return Parse.Promise.when(days.map(function(day) {
                    var forked_day = day.clone();
                    forked_day.set("itinerary", saved_itinerary);
                    return forked_day.save();
                }));
            });
        });
    })
    .fail(response.error);
});

Parse.Cloud.afterDelete("Itinerary", function(request) {
  query = new Parse.Query("Day");
  query.equalTo("itinerary", request.object);
  query.find({
    success: function(days) {
      Parse.Object.destroyAll(days, {
        success: function() {},
        error: function(error) {
          console.error("Error deleting related days " + error.code + ": " + error.message);
        }
      });
    },
    error: function(error) {
      console.error("Error finding related days " + error.code + ": " + error.message);
    }
  });
});
