﻿using System;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web;
using Isp.Core.Configs;
using Isp.Core.Entities;
using Isp.Core.Entities.Jsons.Bing;
using Isp.Core.Exceptions;

namespace Isp.Core.ImageFetchers
{
    /// <summary>
    /// Bing Image Search v5
    /// https://microsoft.com/cognitive-services/en-us/bing-image-search-api
    /// 
    /// Implementation of the image fetching via the Bing's API using web requests
    /// 
    /// Free but with a monthly limit of 1000 transactions
    /// API keys may expire if not used for >= 90 days
    /// 
    /// Attention:
    /// - API allows up to 150 items per request, skipping starts from zero
    /// </summary>
    public class BingImageFetch : ImageFetchBase
    {
        private const string _name = "Bing Image Search";

        protected override async Task<ImageFetchResult> FetchImage(ImageFetchQuery model)
        {
            var requestParams = HttpUtility.ParseQueryString(string.Empty);
            requestParams["q"] = model.Query;

            if (model.Take.HasValue)
            {
                requestParams["count"] = Math.Min(model.Take.Value, 150).ToString();
            }

            if (model.Skip.HasValue)
            {
                requestParams["offset"] = Math.Max(model.Skip.Value, 0).ToString();
            }

            string jsonString;
            using (var client = new HttpClient())
            {
                client.DefaultRequestHeaders.Add("Ocp-Apim-Subscription-Key", AppSetting.BingApiKey);

                var task = await client.GetAsync($"{AppSetting.BingApiUrl}?{requestParams}");
                if (task == null)
                {
                    throw new ImageFetchException("No response from the API", _name);
                }

                jsonString = await task.Content.ReadAsStringAsync();
                if (string.IsNullOrWhiteSpace(jsonString))
                {
                    throw new ImageFetchException("Error when reading the response from the API", _name);
                }
            }

            var search = JsonDeserialize<BingJson>(jsonString, _name);
            var result = new ImageFetchResult
            {
                ImageItems = search?.Value?.Select(i => new ImageItem
                {
                    Link = i.ContentUrl,
                    Title = i.Name
                }),
                TotalCount = search?.TotalEstimatedMatches
            };

            return result;
        }
    }
}