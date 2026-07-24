namespace CallCenter.Application.Common.Exceptions;

public sealed class DataConcurrencyException(string message, Exception innerException)
    : Exception(message, innerException);
