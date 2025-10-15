import { useParams } from 'react-router-dom'

const OrderDetail = () => {
  const { id } = useParams()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
        <p className="text-gray-600">Order ID: {id}</p>
      </div>
      
      <div className="card">
        <p className="text-gray-500">Order detail page coming soon...</p>
      </div>
    </div>
  )
}

export default OrderDetail