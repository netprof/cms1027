using System.Data;
using Microsoft.Data.SqlClient;

namespace CMS.API.Data;

public interface IDbConnectionFactory
{
    Task<IDbConnection> OpenAsync();
}

public class SqlConnectionFactory(string connectionString) : IDbConnectionFactory
{
    public async Task<IDbConnection> OpenAsync()
    {
        var conn = new SqlConnection(connectionString);
        await conn.OpenAsync();
        return conn;
    }
}
