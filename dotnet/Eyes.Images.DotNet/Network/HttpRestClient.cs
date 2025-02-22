﻿using System;
using System.IO;
using System.Net;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using Newtonsoft.Json;
using System.Diagnostics;
using System.Collections.Specialized;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using System.Linq;

namespace Applitools.Utils
{
    /// <summary>
    /// An HTTP rest client.
    /// </summary>
    /// <remarks>Make sure to <c>Dispose</c> or <c>Close</c> responses!</remarks>
    public class HttpRestClient
    {
        #region Fields

        private readonly JsonSerializer json_;
        private string authUser_;
        private string authPassword_;
        private HttpClient httpClient_;
        private IHttpClientProvider httpClientProvider_ = new HttpClientProvider();

        #endregion

        #region Constructors

        static HttpRestClient()
        {
            ServicePointManager.ServerCertificateValidationCallback +=
                new RemoteCertificateValidationCallback(ValidateRemoteCertificate_);
        }

        /// <summary>
        /// Creates a new <see cref="HttpRestClient"/> instance.
        /// </summary>
        /// <param name="jsonSerializer">The JSON serializer to use to <c>null</c> 
        /// to use the default serializer.</param>
        /// <param name="logger"></param>
        /// <param name="httpClientProvider"></param>
        /// <param name="agentId">The full agent ID of the SDK.</param>
        /// <param name="serverUrl">Server's base URL</param>
        public HttpRestClient(Uri serverUrl, string agentId = null, JsonSerializer jsonSerializer = null,
            Logger logger = null, IHttpClientProvider httpClientProvider = null)
        {
            ArgumentGuard.NotNull(serverUrl, nameof(serverUrl));

            ServerUrl = serverUrl;
            json_ = jsonSerializer ?? JsonUtils.CreateSerializer(false, false);
            AgentId = agentId;
            ConnectionLimit = 10;
            Logger = logger ?? new Logger();
            Timeout = TimeSpan.FromMinutes(10);
            httpClientProvider_ = httpClientProvider ?? HttpClientProvider.Instance;
        }

        private HttpRestClient(HttpRestClient other)
        {
            ServerUrl = other.ServerUrl;
            json_ = other.json_;
            AgentId = other.AgentId;
            ConnectionLimit = other.ConnectionLimit;
            Timeout = other.Timeout;
            Proxy = other.Proxy;
            Headers = new NameValueCollection(other.Headers);
            authUser_ = other.authUser_;
            authPassword_ = other.authPassword_;
            Retry = other.Retry;
            FormatRequestUri = other.FormatRequestUri;
            ConfigureRequest = other.ConfigureRequest;
            RequestCompleted = other.RequestCompleted;
            RequestFailed = other.RequestFailed;
            WebRequestCreator = other.WebRequestCreator;
            httpClientProvider_ = other.httpClientProvider_;
            httpClient_ = other.httpClient_;
        }
        #endregion

        #region Events

        /// <summary>
        /// Fired before each request is sent.
        /// </summary>
        public event EventHandler<HttpWebRequestEventArgs> ConfigureRequest;

        /// <summary>
        /// Fired after a request completes and a response is available.
        /// </summary>
        public event EventHandler<HttpRequestCompletedEventArgs> RequestCompleted;

        /// <summary>
        /// Fired after a request has failed (due to an exception).
        /// </summary>
        public event EventHandler<HttpRequestFailedEventArgs> RequestFailed;

        #endregion

        #region Properties

        /// <summary>
        /// Gets or sets the server's base url.
        /// </summary>
        public Uri ServerUrl { get; set; }

        /// <summary>
        /// Gets or sets the HTTP request timeout.
        /// </summary>
        public TimeSpan Timeout { get; set; }

        /// <summary>
        /// Determines whether the input request should be retied based on its response.
        /// </summary>
        public Func<HttpWebRequest, HttpWebResponse, bool> Retry { get; set; }

        /// <summary>
        /// Determines the maximum number of concurrent connections (default is 10).
        /// Excess connections will block.
        /// </summary>
        public int ConnectionLimit { get; set; }
        public Logger Logger { get; }

        /// <summary>
        /// Formats HTTP request URIs.
        /// </summary>
        /// <returns>A new URI to use in the request</returns>
        public Func<Uri, Uri> FormatRequestUri { get; set; }

        /// <summary>
        /// Gets or sets the proxy used by this client or <c>null</c> to obtain the system 
        /// proxy.
        /// </summary>
        public WebProxy Proxy { get; set; }

        public NameValueCollection Headers { get; } = new NameValueCollection();
        public string AgentId { get; set; }
        internal IWebRequestCreate WebRequestCreator { get; set; } = DefaultWebRequestCreator.Instance;
        #endregion

        #region Methods

        #region Public

        /// <summary>
        /// Sets basic authentication credentials.
        /// </summary>
        public void SetBasicAuth(string userName, string password)
        {
            authUser_ = userName;
            authPassword_ = password;
            byte[] byteArray = Encoding.ASCII.GetBytes($"{userName}:{password}");
            GetHttpClient().DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(byteArray));
        }

        internal HttpClient GetHttpClient()
        {
            if (httpClient_ == null)
                httpClient_ = httpClientProvider_.GetClient(Proxy);
            return httpClient_;
        }

        /// <summary>
        /// Sends a POST request to the input path under the base url with a JSON body.
        /// </summary>
        public HttpResponseMessage PostJson<T>(string path, T body, string accept = "application/json")
        {
            return SendJsonHttpWebRequest_(path, "POST", body, accept);
        }

        /// <summary>
        /// Sends a POST request to the input path under the base url with a JSON body.
        /// </summary>
        public void PostJson<T>(TaskListener<HttpResponseMessage> listener, string path, T body, string accept = "application/json")
        {
            SendLongJsonRequest_(listener, path, "POST", body, accept);
        }


        // Used ONLY by IN-REGION
        /// <summary>
        /// Sends a POST request of the input body to the input path under the base url.
        /// </summary>
        public HttpResponseMessage Post(
            string path, MemoryStream body, string contentType = null, string accept = null, string contentEncoding = null)
        {
            return SendHttpWebRequest_(path, "POST", body, contentType, accept, contentEncoding);
        }

        // Used ONLY from test code to notify SauceLabs of test results.
        /// <summary>
        /// Sends a PUT request to the input path under the base url with a JSON body.
        /// </summary>
        public HttpResponseMessage PutJson<T>(string path, T body, string accept = "application/json")
        {
            return SendJsonHttpWebRequest_(path, "PUT", body, accept);
        }


        // Used ONLY by DeleteSession
        /// <summary>
        /// Sends a DELETE request to the input path under the base url.
        /// </summary>
        public HttpResponseMessage Delete(string path, string accept = null)
        {
            return SendHttpWebRequest_(path, "DELETE", null, null, accept, null);
        }

        /// <summary>
        /// Sends a DELETE request to the input path under the base url.
        /// </summary>
        public void Delete(TaskListener<HttpResponseMessage> listener, string path, string accept = null)
        {
            SendLongRequest_(listener, path, "DELETE", null, null, accept, null);
        }

        /// <summary>
        /// Sends a DELETE request to the input path under the base url with a Json body.
        /// </summary>
        public void DeleteJson<T>(TaskListener<HttpResponseMessage> listener,
            string path, T body, string accept = "application/json")
        {
            SendLongJsonRequest_(listener, path, "DELETE", body, accept);
        }

        /// <summary>
        /// Sends a GET request to the input path under the base url.
        /// </summary>
        public HttpResponseMessage Get(string path, string accept = null)
        {
            return SendHttpWebRequest_(path, "GET", null, null, accept, null);
        }

        /// <summary>
        /// Sends a GET request accepting a Json response to the input path under the base url.
        /// </summary>
        public HttpResponseMessage GetJson(string path)
        {
            return Get(path, "application/json");
        }

        protected virtual void ConfigureHttpWebRequest(HttpWebRequest request)
        {
        }

        public HttpRestClient Clone()
        {
            return new HttpRestClient(this);
        }

        #endregion

        #region Private

        private static bool ValidateRemoteCertificate_(
            object sender, X509Certificate cert, X509Chain chain, SslPolicyErrors policyErrors)
        {
            return true;
        }

        private HttpResponseMessage SendJsonHttpWebRequest_<T>(
            string path, string method, T body, string accept)
        {
            return SendHttpWebRequest_(path, method, body, "application/json", accept, null);
        }

        private void SendLongJsonRequest_<T>(
            TaskListener<HttpResponseMessage> listener,
            string path, string method, T body, string accept)
        {
            Stream s = new MemoryStream();
            json_.Serialize(body, s);
            s.Position = 0;

            SendLongRequest_(listener, path, method, s, "application/json", accept, null);
        }

        public void SendAsyncRequest(TaskListener<HttpResponseMessage> listener, Uri url, string method)
        {
            HttpRequestMessage request = CreateHttpRequestMessage(url, method, null, null, null, null);
            SendAsyncRequest(listener, request, Logger, new BackoffProvider(0));
        }

        public void SendAsyncRequest(TaskListener<HttpResponseMessage> listener, HttpRequestMessage request, Logger logger,
            BackoffProvider backoffProvider, TimeSpan? timeout = null)
        {
            int timeoutMS = timeout == null ? (int)Timeout.TotalMilliseconds : (int)timeout.Value.TotalMilliseconds;
            CancellationToken timeoutCancelationToken = new CancellationTokenSource(timeoutMS).Token;
            IAsyncResult asyncResult = GetHttpClient().SendAsync(request, timeoutCancelationToken)
                .AsApm(ar => GetResponseCallBack_(listener, ar, request, logger, backoffProvider), request, logger);
            if (asyncResult != null && asyncResult.CompletedSynchronously)
            {
                logger.Log(TraceLevel.Notice, Stage.General,
                            new { message = "request.BeginGetResponse completed synchronously" });
                GetResponseCallBack_(listener, asyncResult, request, logger, backoffProvider);
            }
        }

        private void GetResponseCallBack_(TaskListener<HttpResponseMessage> listener, IAsyncResult result,
            HttpRequestMessage originalRequest, Logger logger, BackoffProvider backoffProvider)
        {
            if (!result.IsCompleted)
            {
                logger.Log(TraceLevel.Warn, Stage.General, StageType.RequestFailed,
                    new { message = "result is not complete.", result });
                return;
            }
            try
            {
                Task<HttpResponseMessage> resultAsTask = (Task<HttpResponseMessage>)result;
                if (resultAsTask.IsFaulted)
                {
                    if (MakeAnotherAttempt_(listener, originalRequest, logger, backoffProvider)) return;

                    listener.OnFail(
                        new EyesException($"HttpRequestMessage request failed: {originalRequest.Method} {originalRequest.RequestUri}",
                            resultAsTask.Exception));
                    return;
                }
                if (resultAsTask.IsCanceled)
                {
                    if (MakeAnotherAttempt_(listener, originalRequest, logger, backoffProvider)) return;

                    listener.OnFail(
                        new TimeoutException($"HttpRequestMessage request timed out: {originalRequest.Method} {originalRequest.RequestUri}"));
                    return;
                }
                HttpResponseMessage response = resultAsTask.Result;
                if (response.StatusCode >= HttpStatusCode.Ambiguous)
                {
                    listener.OnFail(new EyesException($"Wrong response status: {response.StatusCode} {response.ReasonPhrase}"));
                }
                else
                {
                    listener.OnComplete(response);
                }
                response.Dispose();
            }
            catch (WebException ex)
            {
                if (MakeAnotherAttempt_(listener, originalRequest, logger, backoffProvider)) return;
                listener.OnFail(ex);
            }
        }

        private bool MakeAnotherAttempt_(TaskListener<HttpResponseMessage> listener, HttpRequestMessage originalRequest, Logger logger, BackoffProvider backoffProvider)
        {
            if (!backoffProvider.ShouldWait) return false;

            logger.Log(TraceLevel.Warn, Stage.General, StageType.Retry);
            backoffProvider.Wait();
            HttpRequestMessage request = CloneRequest_(originalRequest);
            SendAsyncRequest(listener, request, logger, backoffProvider);
            return true;
        }

        private static HttpRequestMessage CloneRequest_(HttpRequestMessage originalRequest)
        {
            HttpRequestMessage request = new HttpRequestMessage(originalRequest.Method, originalRequest.RequestUri);
            request.Content = CloneRequestContent_(originalRequest.Content);
            request.Version = originalRequest.Version;
#if NET5_0
            foreach (var option in originalRequest.Options)
            {
                request.Options.Set(new HttpRequestOptionsKey<object>(option.Key), option.Value);
            }
#else
            foreach (var prop in originalRequest.Properties)
            {
                request.Properties.Add(prop);
            }
#endif
            foreach (var header in originalRequest.Headers)
            {
                request.Headers.TryAddWithoutValidation(header.Key, header.Value);
            }
            return request;
        }

        private static HttpContent CloneRequestContent_(HttpContent content)
        {
            if (content == null) return null;

            var ms = new MemoryStream();
            content.CopyToAsync(ms).Wait();
            ms.Position = 0;

            var clone = new StreamContent(ms);
            foreach (var header in content.Headers)
            {
                clone.Headers.Add(header.Key, header.Value);
            }
            return clone;
        }

        private HttpResponseMessage SendHttpWebRequest_(
            string path, string method, object body, string contentType, string accept, string contentEncoding)
        {
            Uri requestUri = string.IsNullOrEmpty(path) ? ServerUrl : new Uri(ServerUrl, path);

            HttpRequestMessage request = CreateHttpRequestMessage(
               requestUri, method, body, contentType, accept, contentEncoding);

            if (request == null)
            {
                throw new NullReferenceException("request is null");
            }

            CancellationTokenSource cts = new CancellationTokenSource(Timeout);
            HttpResponseMessage response = GetHttpClient().SendAsync(request, cts.Token).Result;

            return response;
        }

        private void SendLongRequest_(TaskListener<HttpResponseMessage> listener,
            string path, string method, Stream body, string contentType, string accept, string contentEncoding)
        {
            Stopwatch sw = Stopwatch.StartNew();
            HttpRequestMessage request = null;
            try
            {
                try
                {
                    Uri requestUri = string.IsNullOrEmpty(path) ?
                        ServerUrl : new Uri(ServerUrl, path);

                    request = CreateHttpRequestMessage(
                       requestUri, method, body, contentType, accept, contentEncoding);

                    if (request == null)
                    {
                        throw new NullReferenceException("request is null");
                    }
                    CancellationTokenSource cts = new CancellationTokenSource(Timeout);
                    IAsyncResult asyncResult = GetHttpClient().SendAsync(request, cts.Token).
                        AsApm(ar => OnLongRequestResponse_(ar, request), request, Logger);

                    if (asyncResult != null && asyncResult.CompletedSynchronously)
                    {
                        Logger.Log(TraceLevel.Notice, Stage.General,
                            new { message = "request.BeginGetResponse completed synchronously" });
                        OnLongRequestResponse_(asyncResult, request);
                    }
                }
                catch (WebException ex)
                {
                    if (request == null || ex.Response == null)
                    {
                        throw;
                    }

                    listener.OnFail(ex);
                }
            }
            catch (Exception ex2)
            {
                if (request != null && RequestFailed != null)
                {
                    var args = new HttpRequestFailedEventArgs(sw.Elapsed, request, ex2);
                    CommonUtils.DontThrow(() => RequestFailed(this, args));
                }

                throw;
            }

            void OnLongRequestResponse_(IAsyncResult result, HttpRequestMessage originalRequest)
            {
                if (!result.IsCompleted)
                {
                    Logger.Log(TraceLevel.Warn, Stage.General, new { message = "long request not complete" });
                    return;
                }
                try
                {
                    Task<HttpResponseMessage> resultAsTask = (Task<HttpResponseMessage>)result;
                    if (resultAsTask.IsFaulted)
                    {
                        listener.OnFail(
                            new EyesException($"HttpRequestMessage request failed: {originalRequest.Method} {originalRequest.RequestUri}",
                                resultAsTask.Exception));
                        return;
                    }
                    HttpResponseMessage response = resultAsTask.Result;
                    if (response == null)
                    {
                        throw new NullReferenceException("response is null");
                    }

                    string requestId = null;
                    if (originalRequest.Headers.Contains("x-applitools-eyes-client-request-id"))
                    {
                        requestId = originalRequest.Headers.GetValues("x-applitools-eyes-client-request-id").First();
                    }

                    if (!response.IsSuccessStatusCode)
                    {
                        Logger.Log(TraceLevel.Error, Stage.General, StageType.RequestFailed, new { requestId });
                        throw new Exception($"request failed with status code {response.StatusCode}. request id: {requestId}");
                    }

                    Logger.Log(TraceLevel.Info, Stage.General, StageType.RequestCompleted, new { message = "OnLongRequestResponse", response.Headers, requestId });

                    Uri statusUrl = response.Headers.Location;
                    if (statusUrl == null)
                    {
                        throw new Exception($"LongRequest result has no Location header (request id: {requestId})");
                    }
                    RequestPollingTaskListener requestPollingListener = new RequestPollingTaskListener(this, statusUrl, listener);
                    SendAsyncRequest(requestPollingListener, statusUrl, "GET");
                }
                catch (Exception ex)
                {
                    CommonUtils.LogExceptionStackTrace(Logger, Stage.General, ex);
                    listener.OnFail(ex);
                }
            }
        }

        internal HttpRequestMessage CreateHttpRequestMessage(Uri requestUri, string method,
            object body, string contentType, string accept = null, string contentEncoding = null)
        {
            if (FormatRequestUri != null)
            {
                requestUri = FormatRequestUri(requestUri);
            }

            HttpRequestMessage message = new HttpRequestMessage(new HttpMethod(method), requestUri);

            if (MediaTypeWithQualityHeaderValue.TryParse(accept, out MediaTypeWithQualityHeaderValue mediaTypeWithQualityHeaderValue))
            {
                message.Headers.Accept.Add(mediaTypeWithQualityHeaderValue);
            }

            if (Headers.Count > 0)
            {
                foreach (string key in Headers.AllKeys)
                {
                    message.Headers.Add(key, Headers[key]);
                }
            }

            if (AgentId != null)
            {
                message.Headers.Add("x-applitools-eyes-client", AgentId);
            }

            message.Headers.Add("x-applitools-eyes-client-request-id", Guid.NewGuid().ToString());
            message.Headers.Add("Eyes-Expect", "202+location");
            message.Headers.Add("Eyes-Expect-Version", "2");
            message.Headers.Add("Eyes-Date",
                TimeUtils.ToString(DateTimeOffset.Now, StandardDateTimeFormat.RFC1123));

            if (body != null)
            {
                byte[] bytes = null;
                if (body != null)
                {
                    if (body is byte[] contentBytes)
                    {
                        bytes = contentBytes;
                    }
                    else if (body is MemoryStream memoryStream)
                    {
                        bytes = memoryStream.ReadToEnd();
                    }
                    else
                    {
                        string json = json_.Serialize(body);
                        bytes = Encoding.UTF8.GetBytes(json);
                    }
                }
                message.Content = new ByteArrayContent(bytes);


                if (MediaTypeHeaderValue.TryParse(contentType, out MediaTypeHeaderValue mediaTypeHeaderValue))
                {
                    message.Content.Headers.ContentType = mediaTypeHeaderValue;
                }

                if (contentEncoding != null)
                {
                    message.Content.Headers.ContentEncoding.Add(contentEncoding);
                }
            }

            return message;
        }

        #endregion

        #endregion
    }

    internal class DefaultWebRequestCreator : IWebRequestCreate
    {
        private DefaultWebRequestCreator() { }
        public static DefaultWebRequestCreator Instance = new DefaultWebRequestCreator();
        public WebRequest Create(Uri uri)
        {
            HttpWebRequest request = WebRequest.CreateHttp(uri);
            request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;
            return request;
        }
    }
}
