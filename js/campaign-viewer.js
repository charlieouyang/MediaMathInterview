! function ($) {
    'use strict';

    //api_token
    var api_token = '866045072c359813239ac2d3c6b750cddb4c701b',
        savedSuccess = false,
        savedFailed = false,

        //Get all of the agencies and populate the agencies drop down
        GetAgencies = function () {
            var url = 'http://challenge.mediamath.com/api/agencies?api_token=' + api_token;
            $.get(url, function (data) {
                for (var i = 0; i < data.agencies.length; i++)
                    $("#agencySelect").append("<option value='" + data.agencies[i].name + "' id='" + data.agencies[i]._id + "'>" + data.agencies[i].name + "</option>");

                $('.selectpicker').selectpicker('refresh');
                $("#agencySelect").change(function () {
                    var id = $("#agencySelect option:selected").attr('id');
                    GetAdvertisers(id);
                });
            });
        },

        //Gets all of the advertisers and populates the advertisers drop down
        GetAdvertisers = function (id) {
            var url = 'http://challenge.mediamath.com/api/advertisers?api_token=' + api_token + '&agency_id=' + id;
            $.get(url, function (data) {
                $('#advertiserSelect')
                    .find('option')
                    .remove()
                    .end()
                    .append('<option value="defaultOption">Choose an advertiser...</option>');

                for (var i = 0; i < data.advertisers.length; i++)
                    $("#advertiserSelect").append("<option value='" + data.advertisers[i].name + "' id='" + data.advertisers[i]._id + "'>" + data.advertisers[i].name + "</option>");

                $('.selectpicker').selectpicker('refresh');
            });
        },

        //Gets all of the campaigns and uses the table template to populate the tables
        GetCampaigns = function (adId) {
            var url = 'http://challenge.mediamath.com/api/campaigns?api_token=' + api_token + '&advertiser_id=' + adId;
            $.get(url, function (data) {
                $("#campaignsTableSection").html("");
                $(".datepicker").remove();

                var campaignsTemplate = _.template($("#campaignsTableTemplate").text());
                var html = campaignsTemplate({
                    'campaigns': data.campaigns
                });
                $("#campaignsTableSection").html(html);
                $("#campaignsSection").show();
                $(".selectpicker").selectpicker();
                $(".datepicker").datepicker();
                $('.datepicker').on('changeDate', function(ev){
                    $(this).datepicker('hide');
                });				
                BindOverallCheckButton();
            });
        },

        //Set up the first checkbox
        //If user checks this, all of the checkboxes in the data rows will be checked
        //If user unchecks this, all of the checkboxes in the data rows will be unchecked
        BindOverallCheckButton = function () {
            $("#overallCheckBox").click(function () {
                if ($("#overallCheckBox")[0].checked == true) {
                    $('#campaignsTable tr').each(function (i, row) {
                        if (i > 0) {
                            var $row = $(row),
                                $checkBox = $row.find(".vcenter");
                            $checkBox.find(".selectBox")[0].checked = true;
                        }
                    });
                } else {
                    $('#campaignsTable tr').each(function (i, row) {
                        if (i > 0) {
                            var $row = $(row),
                                $checkBox = $row.find(".vcenter");
                            $checkBox.find(".selectBox")[0].checked = false;
                        }
                    });
                }
            });
        },

        //Check for the rows that are checked by the user
        //Get the data values of the cells in each row
        //Post the data back to the API
        //Alert user for success or failure
        SaveCampaigns = function () {
            savedSuccess = false;
            savedFailed = false;
            var data = "", 
                savedRows = false;
            $('#campaignsTable tr').each(function (i, row) {
                if (i > 0) {
                    if ($(this).find(".modifyItem")[0].checked == true) {
                        savedRows = true;
                        var id = $(this).find(".campaignID").text(),
                            name = $(this).find(".campaignName").val(),
                            status = 'false',
                            budget = $(this).find(".campaignBudget").val(),
                            startDate = $(this).find(".campaignStartDate").val(),
                            endDate = $(this).find(".campaignEndDate").val(),
                            url = "http://challenge.mediamath.com/api/campaigns/" + id + "?&api_token=" + api_token;
                        
						if ($(this).find(".campaignStatus").val() == "Active")
                            status = 'true';
                        
						var data = {
                            "name": name,
                            "budget": budget,
                            "end_date": endDate,
                            "start_date": startDate,
                            "status": status
                        };

                        $.post(url, data).done(function (result) {
                            if (result.status == 'ok')
                                SuccessAlert();
                            else
                                FailedAlert();
                        });

                    }
                }
            });

            if (!savedRows)
                NoRowsSelected();
        },

        //Custom alert function for success
        SuccessAlert = function () {
            if (!savedSuccess) {
                bootbox.dialog({
                    message: "All selected creatives have been successfully updated!",
                    title: "Success!",
                    buttons: {
                        success: {
                            label: "Ok",
                            className: "btn-success",
                            callback: function () {
                                var adId = $("#advertiserSelect option:selected").attr('id');
                                GetCampaigns(adId);
                            }
                        }
                    }
                });
                savedSuccess = true;
            }
        },

        //Custom alert function for failure
        FailedAlert = function () {
            if (!savedFailed) {
                bootbox.dialog({
                    message: "There was an error saving your campaigns!",
                    title: "Error!",
                    buttons: {
                        success: {
                            label: "Ok",
                            className: "btn-danger"
                        }
                    }
                });
                savedFailed = true;
            }
        },

        //Custom alert function for no agencies selected in the dropdown
        NoAgencyChosen = function () {
            bootbox.dialog({
                message: "Please choose an Agency and an Advertiser!",
                title: "Error!",
                buttons: {
                    success: {
                        label: "Ok",
                        className: "btn-danger"
                    }
                }
            });
        },

        //Custom alert function for no rows checked in the campaigns table
        NoRowsSelected = function () {
            bootbox.dialog({
                message: "Please check the campaign for you to save any changes!",
                title: "Warning!",
                buttons: {
                    success: {
                        label: "Ok",
                        className: "btn-danger"
                    }
                }
            });
        };

    //bind the button events and initialize the dropdowns
    $(function () {
        $("#campaignsSection").hide();
        GetAgencies();
        $(".selectpicker").selectpicker();
        $("#getCampaigns").click(function () {
            var adId = $("#advertiserSelect option:selected").attr('id'),
                agId = $("#agencySelect option:selected").attr("id");
            if (adId == null || agId == null)
                NoAgencyChosen();
            else
                GetCampaigns(adId);
        });
        $("#saveCampaigns").click(function () {
            SaveCampaigns();
        });
    })

}(window.jQuery);