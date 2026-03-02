using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Contracts
{
    public interface IGenericRepository<TEntity,TKey> where TEntity:class
    {
        // get all

        Task<IEnumerable<TEntity>> GetAllAsync();

        // get by id
        Task<TEntity?> GetByIdAsync(TKey id);

        // add
        Task AddAsync(TEntity entity);

        // update by id
        void Update(TEntity entity);

        // delete by id
        void Delete(TEntity entity);
    }
}
